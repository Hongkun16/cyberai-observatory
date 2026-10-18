# 厂商资料扩展 — 2026-10-18

根据用户提供的“模型厂商资料”四份上交版Excel及“模型厂商资料_2026-10-18”官方资料归档，扩展腾讯、智谱GLM、DeepSeek和xAI。本轮使用本地已归档的厂商原文、PDF、网页、基准图片逐项核对，没有独立重跑评测，也没有将本地归档描述为本轮在线抓取结果。

## 本轮范围

| 厂商 | 模型／版本／档位 | 记录 | 有数值记录 |
| --- | ---: | ---: | ---: |
| 腾讯 Tencent | 3 | 3 | 2 |
| 智谱 GLM | 8 | 13 | 9 |
| DeepSeek | 7 | 9 | 6 |
| xAI | 7 | 10 | 5 |
| 合计 | 25 | 35 | 22 |

原48个模型、233条记录的历史快照保留；合并后73个目录条目、268条记录、178条数值成绩、339项分配置指标。模型目录包含Grok 4.7 Fast服务档位，不能将条目数解读为独立模型数。

## 已核对成绩与边界

- 腾讯Hy4 preview官方模型卡附表：CyberGym的Hy3为51.8、Hy4 preview为78.4。Hy3是后续报告比较列；不归给Hy3 preview。官方注明Hy3旧成绩可能因harness、judge和反作弊更新而变化。图片中的数字按CyberGym百分制结果保存，原始读数和图片均保留。
- GLM-5：首发博客CyberGym 43.2%，GLM-5.1报告比较列48.3%，独立保留两条。GLM-5.1为68.7%。
- GLM-5.3博客：CyberGym的GLM-5.2为77.2%、GLM-5.3为84.5%；ExploitGym分别为2h/6h的29/39题与105/130题；ExploitBench为24.4%与54.4%的能力覆盖分数。题数不转换为百分数，能力覆盖不解释为完整代码执行率。5.3主列的harness设置不自动归给5.2比较列。
- DeepSeek V4：4月预览版与7月／8月正式版分开。正式Flash-0731的CyberGym为76.7%，Pro-0813为83.3%；Vision-Exp独立列为75.3%。V4.1-Flash的CyberGym、SEC-Bench Pro、ExploitGym为88.1%、62.8%、15.3%，更新日志和技术报告表3互相核对。1017更新不继承9月成绩。
- Grok 4.20 System Card表4：SA配置的Cybench成功率0.53、WMDP Cyber准确率0.91，分别展示53%、91%。表1的AgentHarm违规率0.30、AgentDojo攻击成功率0.33，分别展示30%、33%，按安全性指标解释。MA未披露对应独立成绩。
- Grok 4.7发布页：HackerBench v0.3的风险双用途提示放行率3.3%，越低越好；不是攻击任务成功率。Fast为同一模型服务档位，不复制成绩。

所有comparisonGroup仍为null。新增结果可按指标和配置查看，但本轮没有核定跨报告可比组。

## 文件与维护

- `snapshots/vendors/`：保留用户提供的四份来源Excel及其哈希（见provenance）。
- `sources/vendors/`：36份官方资料，含5份原始PDF及网页／图片；腾讯网页签名资源URL中的云访问标识已遮盖，保留原始与脱敏后两种哈希；MHTML可用Chrome或Edge打开。
- `data/vendor-supplement.json`：维护源，保存新增模型、记录、评测定义、文件目录和来源Excel哈希。
- `data/documents.json`：生成的新增资料目录；与历史`data/pdfs.json`共同用于证据引用校验。
- Excel新增“新增厂商模型”和“新增厂商证据文件”工作表；“成绩补录审计”覆盖全部268条记录。

PDF使用文件页码，网页／图片使用章节、表格和模型列定位。导入时校验归档文件SHA-256与记录指纹；任何断链、重复ID或证据哈希不一致都会使导入失败。原始Excel不增加新行，新增资料通过独立JSON层合并。

## 主要官方来源

- [腾讯Hy4 preview模型卡](https://huggingface.co/tencent/Hy4-preview)
- [GLM-5首发](https://z.ai/blog/glm-5)、[GLM-5.1](https://z.ai/blog/glm-5.1)、[GLM-5.3](https://z.ai/blog/glm-5.3)
- [DeepSeek更新日志](https://api-docs.deepseek.com/updates/)、[V4.1技术报告](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf)
- [Grok 4.20 System Card](https://data.x.ai/2026-04-07-grok-4-20-model-card.pdf)、[Grok 4.7发布页](https://x.ai/news/grok-4-7)
