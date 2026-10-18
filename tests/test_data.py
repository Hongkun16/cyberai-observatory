import copy
import hashlib
import importlib.util
import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("import_workbook", ROOT / "scripts/import_workbook.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class AuditIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / "web/public/data/audit.json").read_text())
        cls.sheets = importer.read_workbook(ROOT / "snapshots/2026-10-17.xlsx")

    def test_workbook_rows_are_not_lost(self):
        actual = Counter((r["modelId"], r["benchmark"], r["status"], r["originalScore"], r["originalConfiguration"], r["pages"]) for r in self.data["evaluations"])
        models = {m["name"]: m["id"] for m in self.data["models"]}
        expected = Counter((models[r["模型/快照"]], r["Benchmark/评测"], r["证据状态"], r["明确文字数值（非统一指标）"], r["实际执行模型/配置"], r["PDF页码（文件页）"]) for name in ["能力评测", "防护与拒答", "待核对与排除"] for r in self.sheets[name])
        self.assertEqual(actual, expected)
        self.assertEqual(len(self.data["evaluations"]), 233)
        self.assertEqual(len(self.data["models"]), 48)

    def test_unconfirmed_records_remain_separate(self):
        self.assertEqual(Counter(r["status"] for r in self.data["evaluations"]), {"已确认": 196, "模型覆盖待核对": 15, "未披露具名项目": 8, "不得归属给Fable生产配置": 8, "明确未运行": 4, "停止报告": 1, "仅方法引用": 1})

    def test_mixed_and_qualified_scores_are_not_converted(self):
        for score in ["plain Cap% 91%；ACE 301/410", ">70%", "100% milestones refused", "10/22 (45.5%)", "2.6×", "7/11至少一次；平均成功率26%", "pass@4 99.2%", "106次control-flow hijack", ""]:
            with self.subTest(score=score):
                self.assertIsNone(importer.parse_percentage(score))
        self.assertEqual(importer.parse_percentage("47.2% pass@1"), 47.2)
        self.assertEqual(importer.parse_percentage("100%"), 100)

    def test_month_precision_does_not_invent_a_day(self):
        monthly = [m for m in self.data["models"] if m["date_precision"] == "month"]
        self.assertEqual(len(monthly), 4)
        self.assertTrue(all(len(m["date"]) == 7 for m in monthly))

    def test_reference_validation_rejects_broken_source_mapping(self):
        importer.validate(self.data)
        broken = copy.deepcopy(self.data)
        broken["evaluations"][0]["pdfPath"] = "pdf/missing.pdf"
        with self.assertRaisesRegex(ValueError, "Unresolved reference"):
            importer.validate(broken)

    def test_rejects_duplicate_ids(self):
        broken = copy.deepcopy(self.data)
        broken["evaluations"][1]["id"] = broken["evaluations"][0]["id"]
        with self.assertRaisesRegex(ValueError, "Duplicate evaluation IDs"):
            importer.validate(broken)

    def test_source_links_and_archive_inventory_preserved(self):
        self.assertEqual(len(self.data["pdfs"]), 69)
        self.assertEqual(sum(p["pages"] for p in self.data["pdfs"]), 4774)
        self.assertEqual(len(self.data["sources"]), 104)
        self.assertTrue(any(s["status"] == "403" for s in self.data["sources"]))
        self.assertTrue(all(len(p["sha256"]) == 64 for p in self.data["pdfs"]))

    def test_no_unreviewed_comparison_groups(self):
        self.assertTrue(all(r["comparisonGroup"] is None for r in self.data["evaluations"]))

    def test_all_confirmed_records_have_pdf_score_review(self):
        records = self.data["evaluations"]
        self.assertEqual(sum(r["scoreAudit"] is not None for r in records), 196)
        self.assertEqual(Counter(r["scoreStatus"] for r in records), {"reported": 156, "graphical": 22, "qualitative": 18, "not_applicable": 37})
        self.assertEqual(sum(not r["originalScore"] and r["scoreStatus"] == "reported" for r in records), 113)
        inventory = {p["path"]: p for p in self.data["pdfs"]}
        for r in records:
            if r["scoreAudit"]:
                self.assertTrue(r["scoreAudit"]["evidence"])
                for evidence in r["scoreAudit"]["evidence"]:
                    self.assertEqual(evidence["sha256"], inventory[evidence["pdfPath"]]["sha256"])
                    self.assertTrue(evidence["pages"])
                    self.assertTrue(evidence["quote"])

    def test_known_pdf_labels_were_transcribed(self):
        records = {r["id"]: r for r in self.data["evaluations"]}
        # Independently checked graph labels and the Cyber Range table, file pages 22/32/33/49.
        for record_id, value in {"CAO-2026-0006": 88.23, "CAO-2026-0019": 93.1, "CAO-2026-0020": 93.33, "CAO-2026-0043": 96.67}.items():
            self.assertEqual(records[record_id]["numericScore"], value)
        self.assertEqual(records["CAO-2026-0033"]["numericScore"], 76.9)
        self.assertIn("13", records["CAO-2026-0033"]["scoreAudit"]["notes"])

    def test_zero_is_a_result_not_a_missing_score(self):
        record = next(r for r in self.data["evaluations"] if r["id"] == "CAO-2026-0081")
        self.assertEqual(record["scoreStatus"], "reported")
        self.assertEqual(record["numericScore"], 0)

    def test_graphical_and_qualitative_results_are_not_estimated(self):
        for r in self.data["evaluations"]:
            if r["scoreStatus"] in ["graphical", "qualitative"]:
                self.assertIsNone(r["numericScore"])
                self.assertEqual(r["metrics"], [])
        r = next(r for r in self.data["evaluations"] if r["id"] == "CAO-2026-0045")
        self.assertEqual(r["scoreStatus"], "graphical")

    def test_source_conflicts_and_later_disclosures_stay_explicit(self):
        records = {r["id"]: r for r in self.data["evaluations"]}
        conflict = records["CAO-2026-0130"]
        self.assertIn("1.0%", conflict["score"])
        self.assertIn("0.9%", conflict["score"])
        self.assertTrue(records["CAO-2026-0198"]["scoreAudit"]["laterDisclosure"])
        self.assertFalse(records["CAO-2026-0112"]["scoreAudit"]["laterDisclosure"])
        self.assertIn("37/40", records["CAO-2026-0112"]["configuration"])
        self.assertIn("3 trials", records["CAO-2026-0129"]["configuration"])

    def test_download_workbook_contains_the_reviewed_scores(self):
        import openpyxl
        path = ROOT / "web/public" / self.data["meta"]["downloadWorkbook"]
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), self.data["meta"]["reviewedWorkbookSha256"])
        workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
        self.assertIn("成绩补录审计", workbook.sheetnames)
        rows = list(workbook["成绩补录审计"].values)[4:]
        self.assertEqual(len(rows), 233)
        actual = {r[0]: r for r in rows}
        for record in self.data["evaluations"]:
            self.assertEqual(actual[record["id"]][3], importer.SCORE_STATUS_LABELS[record["scoreStatus"]])
            self.assertEqual(actual[record["id"]][4] or "", record["score"])


if __name__ == "__main__":
    unittest.main()
