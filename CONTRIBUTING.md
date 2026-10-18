# 贡献指南

欢迎补充公开证据、修正模型归属、完善比较条件和改进网站。

提交数据修订时请提供：模型精确版本、评测与指标名称、官方来源链接、章节 / 页码或图表、原始成绩、运行配置，以及属于首次披露还是后续补测。

原始快照由Excel导入，PDF成绩补录由`data/score-audit/*.json`维护。新增/修正成绩时请编辑对应复核记录，保留PDF文件页码、提取方式和读数依据，运行`npm run data:import`同步生成JSON、CSV与Excel。原始历史Excel不因成绩补录被覆盖。扩展原快照中的模型时还需在`data/model-identities.json`中加入ID和有证据支持的日期精度，不把其他模型结果自动继承到待核记录。

核对或修订状态时保留记录 ID，说明修改依据。来源 URL 变化或需要拆分配置时，按数据字典维护身份映射。运行：

```bash
npm run data:import
npm run test:data
npm run build
```

前端交互变更需运行浏览器检查。PR 自动执行数据校验与浏览器检查，成功后由维护者合并；只有 main 分支部署。

新增历史成绩和可比组时，请先把原始记录与分析判断分开：相同评测名称不足以成立可比组。

新增腾讯、智谱GLM、DeepSeek、xAI、Kimi资料时维护`data/vendor-supplement.json`，归档原文件到`sources/vendors/`并记录SHA-256；新增记录在`data/record-identities.json`登记指纹与稳定ID。PDF填写文件页码，网页／图片填写evidence.section；不将网页章节写成PDF页码。日期依据文件在模型dateEvidencePaths中保留。不要编辑生成的data/documents.json或其他导出文件。

中英文界面由`web/src/language.tsx`维护，展示数据的英文译文保存在`web/src/data.en.json`；新增模型用途、日期说明、评测说明或分项指标／配置时，请同时提供英文译文。原始摘录和证据备注不改写，英文结果弹窗可展开查看原文。

评测显示顺序参考`data/benchmark-usage.json`，原表保存在`snapshots/Benchmark_Summary.xlsx`，导入时校验文件哈希。Times仅表示该参考表的使用次数，不等于本站模型数；未列评测按本站已披露数值成绩的去重模型数排序。更新参考表时同步JSON，不据此增加或推断模型成绩。

引入其他厂商比较列或独立机构评测时，填写assessmentProvider和assessmentKind。相同模型、相同评测的不同来源分开留存；版本、单位、预算和近似值保持原样，不继承共享报告或服务档位的成绩。
