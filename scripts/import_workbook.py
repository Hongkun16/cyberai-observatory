#!/usr/bin/env python3
"""Import the audit workbook using only Python's standard library."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import shutil
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCORE_REVIEW_DATE = "2026-10-18"
SCORE_STATUS_LABELS = {
    "reported": "已核实数值",
    "graphical": "仅图示，未标精确值",
    "qualitative": "仅定性结论",
    "not_disclosed": "未披露数值",
    "not_applicable": "不适用（证据未确认）",
}
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def read_workbook(path: Path) -> dict[str, list[dict[str, str]]]:
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(n.itertext()) for n in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", NS)]
        relationships = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
        result = {}
        for sheet in ET.fromstring(archive.read("xl/workbook.xml")).find("s:sheets", NS):
            target = relationships[sheet.attrib[f"{{{REL}}}id"]]
            target = target.lstrip("/") if target.startswith("/") else "xl/" + target
            rows = []
            for row in ET.fromstring(archive.read(target)).findall(".//s:row", NS):
                cells = {}
                for cell in row:
                    letters = re.match(r"[A-Z]+", cell.attrib["r"])[0]
                    col = 0
                    for letter in letters:
                        col = col * 26 + ord(letter) - 64
                    node = cell.find("s:v", NS)
                    inline = cell.find("s:is", NS)
                    value = node.text if node is not None else "".join(inline.itertext()) if inline is not None else ""
                    cells[col - 1] = strings[int(value)] if cell.attrib.get("t") == "s" else (value or "")
                rows.append(cells)
            headers = rows[3]
            result[sheet.attrib["name"]] = [
                {label: row.get(index, "") for index, label in headers.items()}
                for row in rows[4:] if any(row.values())
            ]
        return result


def parse_percentage(score: str) -> float | None:
    """Never turn mixed metrics, ranges, ratios or qualified claims into a percent."""
    match = re.fullmatch(r"(\d+(?:\.\d+)?)%\s*(?:pass@1)?", score.strip())
    if not match:
        return None
    value = float(match[1])
    if not 0 <= value <= 100:
        raise ValueError(f"Percentage outside [0,100]: {score}")
    return value


def fingerprint(model_id: str, benchmark: str, category: str, source_url: str) -> str:
    # Corrections to a score, status or configuration must preserve its deep link.
    return hashlib.sha256(json.dumps([model_id, benchmark, category, source_url], ensure_ascii=False).encode()).hexdigest()


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def apply_score_audit(records, pdfs):
    """Apply individually reviewed PDF evidence; never infer missing scores."""
    reviews = {}
    for path in sorted((ROOT / "data/score-audit").glob("*.json")):
        for review in json.loads(path.read_text(encoding="utf-8")):
            if review["id"] in reviews:
                raise ValueError(f"Duplicate score audit: {review['id']}")
            reviews[review["id"]] = review
    confirmed = {r["id"] for r in records if r["status"] == "已确认"}
    if set(reviews) != confirmed:
        raise ValueError(f"Score audit coverage mismatch. Missing: {sorted(confirmed - set(reviews))}; extra: {sorted(set(reviews) - confirmed)}")
    inventory = {pdf["path"]: pdf for pdf in pdfs}
    for record in records:
        record["originalScore"] = record["score"]
        record["originalConfiguration"] = record["configuration"]
        if record["status"] != "已确认":
            record.update(scoreStatus="not_applicable", metrics=[], scoreAudit=None)
            continue
        review = reviews[record["id"]]
        status = review["scoreStatus"]
        if status not in SCORE_STATUS_LABELS or status == "not_applicable":
            raise ValueError(f"Invalid score status: {record['id']}")
        if not review.get("evidence"):
            raise ValueError(f"Score audit missing evidence: {record['id']}")
        evidence = []
        for item in review["evidence"]:
            pdf = inventory.get(item["pdfPath"])
            if not pdf or not item["pages"] or not item["quote"]:
                raise ValueError(f"Invalid score evidence: {record['id']}")
            evidence.append({**item, "sha256": pdf["sha256"], "sourceUrl": pdf["downloadUrl"] or pdf["sourceUrl"]})
        score = review.get("score", "").strip()
        if status == "reported" and not score:
            raise ValueError(f"Reported score is empty: {record['id']}")
        record.update(
            score=score, numericScore=parse_percentage(score), scoreStatus=status,
            configuration=review.get("configurationCorrection", record["configuration"]),
            metrics=review.get("metrics", []),
            scoreAudit={"reviewedAt": SCORE_REVIEW_DATE, "method": review["method"],
                        "notes": review.get("notes", ""), "evidence": evidence,
                        "laterDisclosure": review.get("laterDisclosure", False)},
        )
    return records


def merge_vendor_supplement(data, registry):
    """Merge archived vendor evidence without changing the historical workbook."""
    supplement = json.loads((ROOT / "data/vendor-supplement.json").read_text(encoding="utf-8"))
    for item in supplement["provenance"] + supplement["documents"]:
        path = ROOT / item["path"]
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != item["sha256"]:
            raise ValueError(f"Vendor archive hash mismatch: {item['path']}")
    for r in supplement["evaluations"]:
        key = fingerprint(r["modelId"], r["benchmark"], r["category"], r["sourceUrl"])
        if registry.get(key) != r["id"]:
            raise ValueError(f"Vendor record identity mismatch: {r['id']}")
    data["models"].extend(supplement["models"])
    data["evaluations"].extend(supplement["evaluations"])
    data["benchmarks"].extend(supplement["benchmarks"])
    data["documents"] = supplement["documents"]
    records = data["evaluations"]
    data["meta"].update(
        supplementalAsOf=supplement["asOf"],
        supplementalModelCount=len(supplement["models"]),
        supplementalRecordCount=len(supplement["evaluations"]),
        supplementalScoreCount=sum(r["scoreStatus"] == "reported" for r in supplement["evaluations"]),
        modelCount=len(data["models"]), recordCount=len(records),
        scoreCount=sum(r["scoreStatus"] == "reported" for r in records),
        addedScoreCount=sum(not r["originalScore"] and r["scoreStatus"] == "reported" for r in records),
        numericCount=sum(r["numericScore"] is not None for r in records),
        reviewedScoreRecords=sum(r["scoreAudit"] is not None for r in records),
        metricCount=sum(len(r["metrics"]) for r in records),
        scoreStatusCounts=dict(Counter(r["scoreStatus"] for r in records)),
    )


def build(workbook: Path, as_of: str):
    sheets = read_workbook(workbook)
    identities = json.loads((ROOT / "data/model-identities.json").read_text())
    by_name = {m["name"]: m for m in identities}
    registry_path = ROOT / "data/record-identities.json"
    registry = json.loads(registry_path.read_text()) if registry_path.exists() else {}
    next_id = max([int(v.rsplit("-", 1)[1]) for v in registry.values()] or [0]) + 1
    models = []
    for row in sheets["模型总表"]:
        identity = by_name[row["模型/快照"]]
        models.append({
            **identity, "provider": "OpenAI" if row["厂商"].startswith("OpenAI") else row["厂商"],
            "role": row["定位（原表概括）"], "dateEvidence": row["本次核验到的日期"],
            "dateNote": row["日期口径"], "dateSource": row["日期证据URL"],
            "reportType": row["卡片类型/独立性"], "sourceUrl": row["Model Card 官方URL"],
            "pdfKind": row["PDF类型"], "pdfPath": row["逐模型本地PDF"],
            "pdfPages": int(row["PDF页数"]), "sha256": row["逐模型PDF SHA-256"],
            "conclusion": row["重要配置/核验结论"], "caveats": row["未披露/待核/排除事项"],
        })
    records = []
    for name in ["能力评测", "防护与拒答", "待核对与排除"]:
        for row in sheets[name]:
            model_id = by_name[row["模型/快照"]]["id"]
            key = fingerprint(model_id, row["Benchmark/评测"], row["类型"], row["来源官方URL"])
            if key not in registry:
                registry[key] = f"CAO-2026-{next_id:04d}"
                next_id += 1
            score = row["明确文字数值（非统一指标）"]
            records.append({
                "id": registry[key], "modelId": model_id, "benchmark": row["Benchmark/评测"],
                "status": row["证据状态"], "category": row["类型"], "score": score,
                "numericScore": parse_percentage(score), "configuration": row["实际执行模型/配置"],
                "section": row["章节/表图"], "pages": row["PDF页码（文件页）"],
                "sourceKind": row["来源性质"], "sourceUrl": row["来源官方URL"],
                "pdfUrl": row["PDF重定向直链"], "pdfPath": row["证据PDF（本地）"], "note": row["说明"],
                "comparisonGroup": None,
            })
    records.sort(key=lambda r: r["id"])
    benchmarks = [{"name": r["Benchmark/评测"], "openness": r["开放性/归属"], "task": r["主要任务"],
                   "caveat": r["设置与解释限制"], "sourceUrl": r["定义依据URL"]} for r in sheets["基准说明"]]
    pdfs = [{"name": r["模型/文档"], "purpose": r["用途"], "kind": r["PDF类型"], "path": r["本地文件"],
             "pages": int(r["文件页数"]), "sha256": r["文件SHA-256"], "sourceUrl": r["官方来源URL"],
             "downloadUrl": r["重定向URL"], "fetchedAt": r["抓取时间UTC"]} for r in sheets["PDF目录"]]
    revisions = [{"subject": r["涉及模型/问题"], "before": r["原表状态/问题"], "change": r["本次正文核验修订"],
                  "sourceUrl": r["官方入口"], "pages": r["定位"]} for r in sheets["修订记录"]]
    sources = [{"url": r["URL"], "status": r["HTTP状态"], "finalUrl": r["最终URL"],
                "contentType": r["内容类型"], "sha256": r["原始文件SHA-256"],
                "fetchedAt": r["抓取时间UTC"], "error": r["错误"]} for r in sheets["访问日志"]]
    apply_score_audit(records, pdfs)
    data = {"meta": {"version": "0.2.0", "asOf": as_of, "workbook": "snapshots/" + workbook.name,
                     "workbookSha256": hashlib.sha256(workbook.read_bytes()).hexdigest(),
                     "scope": "公开报告证据整理；未独立重跑模型评测", "modelCount": len(models),
                     "recordCount": len(records), "scoreCount": sum(r["scoreStatus"] == "reported" for r in records),
                     "originalScoreCount": sum(bool(r["originalScore"]) for r in records),
                     "addedScoreCount": sum(not r["originalScore"] and r["scoreStatus"] == "reported" for r in records),
                     "numericCount": sum(r["numericScore"] is not None for r in records),
                     "scoreReviewDate": SCORE_REVIEW_DATE, "reviewedScoreRecords": sum(r["scoreAudit"] is not None for r in records),
                     "metricCount": sum(len(r["metrics"]) for r in records),
                     "scoreStatusCounts": dict(Counter(r["scoreStatus"] for r in records)),
                     "downloadWorkbook": "downloads/audit-2026-10-18.xlsx"},
            "models": models, "evaluations": records, "benchmarks": benchmarks, "pdfs": pdfs,
            "revisions": revisions, "sources": sources}
    merge_vendor_supplement(data, registry)
    usage = json.loads((ROOT / "data/benchmark-usage.json").read_text(encoding="utf-8"))
    if hashlib.sha256((ROOT / usage["sourceWorkbook"]).read_bytes()).hexdigest() != usage["sha256"]:
        raise ValueError("Benchmark summary workbook hash mismatch")
    if len({item["name"] for item in usage["entries"]}) != len(usage["entries"]) or any(item["times"] < 0 for item in usage["entries"]):
        raise ValueError("Invalid benchmark usage reference")
    data["benchmarkUsage"] = usage
    validate(data)
    write_json(registry_path, registry)
    for key in ["models", "evaluations", "benchmarks", "sources", "revisions", "pdfs", "documents", "meta"]:
        write_json(ROOT / f"data/{key}.json", data[key])
    write_json(ROOT / "web/public/data/audit.json", data)
    downloads = ROOT / "web/public/downloads"
    downloads.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(workbook, downloads / "audit-2026-10-17.xlsx")
    fields = ["id", "modelId", "benchmark", "status", "category", "score", "scoreStatus", "originalScore", "configuration", "sourceUrl", "section", "pages", "note", "metrics", "scoreEvidence", "scoreReviewNotes"]
    with (downloads / "results.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        for record in records:
            writer.writerow({**record, "metrics": json.dumps(record["metrics"], ensure_ascii=False),
                             "scoreEvidence": json.dumps(record["scoreAudit"]["evidence"] if record["scoreAudit"] else [], ensure_ascii=False),
                             "scoreReviewNotes": record["scoreAudit"]["notes"] if record["scoreAudit"] else record["status"]})
    print(json.dumps({**data["meta"], "statuses": dict(Counter(r["status"] for r in records))}, ensure_ascii=False, indent=2))
    return data


def validate(data):
    models = {m["id"] for m in data["models"]}
    if len(models) != len(data["models"]):
        raise ValueError("Duplicate model IDs")
    ids = [r["id"] for r in data["evaluations"]]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate evaluation IDs")
    benchmarks = {b["name"] for b in data["benchmarks"]}
    if len(benchmarks) != len(data["benchmarks"]):
        raise ValueError("Duplicate benchmark names")
    inventory = {p["path"]: p for p in data["pdfs"] + data.get("documents", [])}
    for m in data["models"]:
        pattern = r"\d{4}-\d{2}" if m["date_precision"] == "month" else r"\d{4}-\d{2}-\d{2}"
        if not re.fullmatch(pattern, m["date"]):
            raise ValueError(f"Date precision mismatch: {m['id']}")
        if m["pdfPath"] not in inventory:
            raise ValueError(f"Unresolved model report: {m['id']}")
    for r in data["evaluations"]:
        if r["modelId"] not in models or r["benchmark"] not in benchmarks or r["pdfPath"] not in inventory:
            raise ValueError(f"Unresolved reference: {r['id']}")
        for field in ["sourceUrl", "pdfUrl"]:
            if not r[field].startswith("https://"):
                raise ValueError(f"Invalid source URL: {r['id']}")
        if r["numericScore"] != parse_percentage(r["score"]):
            raise ValueError(f"Score conversion mismatch: {r['id']}")
        if r.get("scoreStatus") not in SCORE_STATUS_LABELS:
            raise ValueError(f"Unknown score status: {r['id']}")
        if r["status"] != "已确认" and (r["scoreStatus"] != "not_applicable" or r["metrics"]):
            raise ValueError(f"Unconfirmed evidence has scored metrics: {r['id']}")
        if r["status"] == "已确认" and not r.get("scoreAudit"):
            raise ValueError(f"Confirmed record lacks score review: {r['id']}")
        if r.get("scoreAudit"):
            if not r["scoreAudit"]["evidence"]:
                raise ValueError(f"Missing score evidence: {r['id']}")
            for evidence in r["scoreAudit"]["evidence"]:
                document = inventory.get(evidence["pdfPath"])
                if not document or evidence["sha256"] != document["sha256"]:
                    raise ValueError(f"Score evidence hash mismatch: {r['id']}")
                if not evidence.get("quote") or not (evidence.get("pages") or evidence.get("section")):
                    raise ValueError(f"Missing score evidence location: {r['id']}")
        if r["scoreStatus"] != "reported" and (r["numericScore"] is not None or r["metrics"]):
            raise ValueError(f"Non-numeric review has numeric metrics: {r['id']}")
        for metric in r["metrics"]:
            if not metric.get("label") or "value" not in metric or not metric.get("unit"):
                raise ValueError(f"Invalid extracted metric: {r['id']}")
            if metric["unit"] == "percent" and isinstance(metric["value"], (int, float)) and not 0 <= metric["value"] <= 100:
                raise ValueError(f"Percentage metric outside range: {r['id']}")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", type=Path, default=ROOT / "snapshots/2026-10-17.xlsx")
    parser.add_argument("--as-of", default="2026-10-17")
    args = parser.parse_args()
    build(args.workbook, args.as_of)
