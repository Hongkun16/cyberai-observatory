# 数据字典

网站数据：`web/public/data/audit.json`。生成脚本：`scripts/import_workbook.py`。

## evaluations

| 字段 | 含义 |
| --- | --- |
| `id` | 稳定证据编号，如 `CAO-2026-0002` |
| `modelId` | 对应 models 中的 ID |
| `benchmark` | 原表评测名称；可能是描述性任务标签 |
| `status` | 原表证据状态，未合并未确认类别 |
| `category` | 能力 / 防护与鲁棒性 / 行为与拒答 |
| `score` | 原文成绩或定性表述，须结合scoreStatus解读，不用空值推断未披露 |
| `scoreStatus` | reported数值 / graphical仅图示 / qualitative仅定性 / not_disclosed未披露 / not_applicable证据未确认 |
| `originalScore`, `originalConfiguration` | 原始Excel的成绩栏与配置，保留以便核对修订 |
| `metrics` | 分配置指标数组：label、value、unit、configuration；不混合防护开关与预算 |
| `scoreAudit` | 复核日期、提取方式、备注、后续披露标识及PDF证据列表；未确认归属的记录为null |
| `numericScore` | 只解析单一百分数，其他为 `null` |
| `configuration` | 题集、指标、预算、harness、防护等设置 |
| `section`, `pages` | 原文定位；pages 为 PDF 文件页码 |
| `sourceKind` | 官方原始 PDF 或官方网页转制 PDF |
| `sourceUrl`, `pdfUrl` | 来源和最终文档链接 |
| `pdfPath` | 原资料包相对路径；网站不假设该文件本地可下载 |
| `note` | 原表核验备注，包含后续补测说明 |
| `comparisonGroup` | 可比组。尚未人工核定，当前统一为 `null` |

## models

`id`, `name`, `provider` 标识模型。`date` 与 `date_precision` 组合使用：day 为 YYYY-MM-DD，month 为 YYYY-MM。`dateEvidence`, `dateNote`, `dateSource` 保存日期依据；不能把日期精度提升到来源未支持的程度。

`role`, `reportType`, `sourceUrl`, `pdfKind`, `pdfPath`, `pdfPages`, `sha256`, `conclusion`, `caveats` 均由模型总表导入。

## 其他集合

- `benchmarks`：名称、开放性、任务、设置限制和定义来源。
- `pdfs`：69 个归档文件的来源、类型、页数、哈希、抓取时间。
- `sources`：104 条访问日志，包含失败和最终重定向。
- `revisions`：20 项原表修订，保留原问题、修改和证据定位。
- `meta`：快照日期、范围、计数和源工作簿哈希。

## PDF成绩复核层

`data/score-audit/*.json` 对196条已确认记录逐项提供审查结果。每条至少有PDF路径、文件页码、原文/图表读数依据；生成时附加归档哈希与官方来源。`configurationCorrection` 仅用于有证据的原配置纠正；`laterDisclosure: true` 明确成绩来自后续报告，不能把原报告与后续报告的不同数值混成一次测试。

数值字段保留上下界、比例和原始单位。只有number类型、percent或count单位的指标进入图表；`>70`、`<1`及区间等不作为精确点绘制。`numericScore` 仍只解析纯单一百分数，复杂记录由metrics逐项访问。

## 稳定 ID

`data/record-identities.json` 用模型、评测名称、类别和来源 URL 的指纹映射到既有 ID。成绩、配置和状态的修订不会更改 ID。若来源 URL 被修正或同一来源需要新增多条配置记录，应人工维护身份映射并检查深链接，不要重新编号所有记录。重复 ID 或未解析引用会使导入失败。
