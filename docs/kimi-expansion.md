# Kimi 扩展 — 2026-10-18

根据用户提供的`模型厂商资料_上交版_含Kimi_仅Excel.zip`中的Kimi模型清单，并使用同目录配套的`Kimi_Excel及本地资料.zip`逐项核对PDF和网页归档。两个压缩包的Kimi Excel字节一致，原表保存在`snapshots/vendors/月之暗面_Kimi_上交版.xlsx`。本轮没有重新抓取网页或独立运行评测。

## 范围

新增6个版本／服务档位：Kimi K2.5、K2.6、K2.7 Code、K2.7 Code HighSpeed、K3、K2.8 Preview。新增14条记录，其中11条有数值、共18项分配置指标。全库为79个目录条目、282条记录、189条数值记录、357项指标。

K2.7 Code HighSpeed是同模型加速档位，7月9日正式上线；6月12日仅为预告。K2.7 Code、HighSpeed和K2.8 Preview均不继承其他版本的网安成绩。

## 结果与来源

| 模型 | 评测 | 结果 | 评测方 |
| --- | --- | --- | --- |
| K2.5 | CyberGym | 41.3%，difficulty level 1，Avg@5 | Moonshot技术报告表4、附录E.5 |
| K2.6 | CyberBench v1 | Overall accuracy 74.35% | Vals AI，2026-09-16归档版 |
| K3 | Real-world Vulnerability Discovery | 16个此前未知漏洞、6个项目；人工复核候选约70%确认为真实 | Moonshot技术报告§6.2.2 |
| K3 | 内部36题利用集 | 14/36（38.9%），其中10题来自用户态 | Moonshot技术报告§6.2.2 |
| K3 | CyberGym | 80.0%，单次pass@1 | GLM-5.3报告的Kimi比较列 |
| K3 | ExploitGym | 2h完成36题，6h完成70题 | GLM-5.3报告，明确Kimi配置与40 TPS时间归一化 |
| K3 | ExploitBench | Cap 32.2% | GLM-5.3报告比较列 |
| K3 | ExploitBench | Cap 32%，完整ACE 0/41 | UK AISI／CAISI，2026-07-23初步评估 |
| K3 | The Last Ones (TLO) | 平均到达17/32步，10次尝试成功1次；每次100M tokens | UK AISI／CAISI |
| K3 | CyberBench v1 | Overall accuracy 79.03% | Vals AI，2026-09-16归档版 |
| K3 | CyberBench v1.1 | Overall accuracy 75.24% | Vals AI，2026-10-12版 |

K2.5的编程成绩按五次独立运行平均（Avg@5），不改写成其他报告的pass@1。内部36题集不是公开ExploitGym或ExploitBench。Tier 1的约70%只针对人工复核候选，保留为限定字符串`~70`，不作为精确数值点绘图。

GLM来源32.2%与AISI来源32%保留为不同记录，不覆盖、平均或擅自提高精度。CyberBench v1.1使用离线沙箱与加固clean-room grader，保留60题PoC和56题Patch的版本设置，不与v1直接比较或覆盖旧值。未核定可比组，所有comparisonGroup仍为空。

K2.5报告在模型发布后提交；K3报告包含截至7月23日的第三方评估。本轮不将这些报告成绩当作首发当天已披露的结果，后续披露标记保留。

## 归档与展示

新增10份资料：2份PDF、7份MHTML和1份HTML；GLM-5.3报告与已有归档哈希一致，直接复用。新文件位于`sources/vendors/Moonshot/`，SHA-256及来源位于`data/documents.json`。GitHub中的PDF总数从74增至76。

数据维护源继续使用`data/vendor-supplement.json`。新增`assessmentProvider`和`assessmentKind`标注厂商自测、其他厂商评测、独立机构评测，网站弹窗、CSV和Excel均保留。原始摘录和配置可在英文界面展开查看；不因翻译改变指标数值或证据。

`logos/kimi.svg`的原始副本保存在`assets/logos/original/kimi.svg`，统一转换为128×128 RGBA透明PNG，保持比例和12像素留白。网站使用`web/public/logos/kimi.png`。
