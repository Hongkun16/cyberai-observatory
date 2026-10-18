# CyberAI Observatory

**追踪大模型网络安全能力的演进，让每个结果都能回到证据。**

[浏览网站](https://hongkun16.github.io/cyberai-observatory/) · [能力进展](https://hongkun16.github.io/cyberai-observatory/#progress) · [模型目录](https://hongkun16.github.io/cyberai-observatory/#models) · [研究方法](docs/methodology.md) · [下载 Excel](web/public/downloads/audit-2026-10-18.xlsx)

CyberAI Observatory 是一个基于公开报告的大模型网络安全评测资料库与交互网站，覆盖 **OpenAI、Anthropic、Google、Tencent、GLM、DeepSeek、xAI、Kimi 八家厂商**，汇集厂商自测、其他厂商比较和独立机构评估，提供成绩查询、配置筛选、时间趋势和来源追溯。

截至 **2026-10-18**，资料库包含：

| 内容 | 数量 |
| --- | ---: |
| 模型／版本／服务档位 | 79 |
| 评测／任务标签 | 58 |
| 逐项记录 | 282 |
| 证据归属已确认的记录 | 229 |
| 含数值成绩的记录 | 189 |
| 分配置指标 | 357 |
| PDF 报告与材料 | 76 |

项目整理公开证据，没有独立运行或复现模型评测。服务档位与模型版本分别列示，目录条目数不等于独立模型数。

![CyberAI Observatory 首页](docs/preview.png)

## 网站功能

- **能力对比：**按评测、指标、厂商与运行配置筛选柱状图和成绩表，查看分项结果及报告链接。
- **进展趋势：**按模型日期展示同一指标的表现，月精度日期单列。
- **模型目录：**搜索模型、筛选厂商，查看各版本的评测覆盖、成绩和发布信息。
- **评测库：**查询任务定义、开放性和解释限制，常用评测优先展示。
- **中英文切换：**一键切换界面与数据说明，保留当前筛选并记住语言选择；证据原文可单独展开。
- **数据下载：**提供 Excel、CSV 和完整 JSON，保留指标、配置、评测方及证据定位。

评测排序参考 `Benchmark_Summary.xlsx` 的使用次数；页面中的模型数按本站已披露数值成绩去重统计，两者分别解释。

## 如何解读成绩

**指标与运行配置是两个维度。**例如 ExploitBench 的 **Cap%** 表示利用能力覆盖率，**Full ACE** 表示完整任意代码执行；2h／6h、Plain／AutoNudge、防护开启／关闭则属于运行配置。能力覆盖率不能解读为完整利用成功率，不同预算和防护设置的结果分别保留。

189 条记录含有数值成绩，22 条只有未标精确值的图示，18 条只有定性结论，53 条因归属未确认、未披露或不独立计分而不适用。范围、上下界与近似值保留原样，未标值曲线不估读；次数、比例和百分数按各自单位展示，不混合平均。

**同名评测不自动可比。**题集、指标、采样预算、工具环境、评分器和防护设置都可能影响成绩。网站不计算综合排名，也不连接尚未核定可比性的成绩点。横轴采用模型日期，后续报告披露的结果另行标注；月精度日期不补造具体日。

“已确认”表示原文支持该模型与测试的对应关系，不代表任务全部成功或结果已被独立复现。不同来源、模型快照与服务档位不互相继承成绩。具体解释见[研究方法](docs/methodology.md)和[数据字典](docs/data-dictionary.md)。

## 数据与证据

每条评测记录使用稳定 ID，保留模型、评测、成绩、指标、运行配置、官方或评测机构链接，以及 PDF 文件页码或网页章节。归档材料包含 PDF、HTML、MHTML 和基准图表，并以 SHA-256 校验文件内容。成绩、配置或状态的修订不会改变既有记录 ID。

```text
公开报告、评测资料与模型清单
              ↓ 导入、结构化整理与证据校验
模型 · 评测 · 分项成绩 · 配置 · 来源
              ↓
       JSON / CSV / Excel
              ↓ React + TypeScript + Vite
         交互网站 / GitHub Pages
```

| 目录 | 内容 |
| --- | --- |
| `snapshots/` | 来源工作簿、模型清单与评测使用统计 |
| `pdf/`、`sources/vendors/` | 模型报告、评测机构资料、网页与图表归档 |
| `data/` | 结构化模型、评测、成绩、证据索引及身份映射 |
| `scripts/` | 数据导入、校验、Excel 导出与图标转换 |
| `web/src/` | 网站页面、图表、样式与中英文展示 |
| `web/public/` | 网站数据、下载文件与标准化厂商图标 |
| `tests/` | 数据完整性与浏览器交互检查 |
| `docs/` | 研究方法、字段说明与资料核对说明 |

完整网站数据位于 `web/public/data/audit.json`。报告与材料目录见 `data/pdfs.json` 和 `data/documents.json`。来源工作簿与报告归档保留供核对，网站数据和下载文件由脚本生成，Excel 使用固定时间戳以支持重复构建。

## 本地运行

需要 Node.js 22、npm 和 Python 3.10+。

```bash
npm ci
python3 -m pip install -r requirements.txt
npm run data:import
npm run dev
```

构建与数据检查：

```bash
npm run test:data
npm run build
```

浏览器检查：

```bash
npx playwright install --with-deps chromium
npm run preview -- --port 4173
# 在另一终端运行
npm run test:web
```

构建产物位于 `dist/`。浏览器检查覆盖桌面与手机布局、键盘操作、筛选、指标单位、模型详情、深链接、中英文切换和文件下载。厂商标志的转换方法见[图标说明](assets/logos/README.md)。

## 部署与维护

推送 `main` 后，GitHub Actions 自动导入数据、检查生成结果、运行数据测试、构建网站并执行浏览器检查，通过后部署到 GitHub Pages。PR 执行相同检查。站点路径由 `VITE_BASE_PATH` 设置，哈希导航支持刷新与直接分享。

维护数据时，请提供模型精确版本、评测与指标名称、原始成绩、运行配置、来源链接和章节／页码，明确评测方及披露时间。具体流程见[贡献指南](CONTRIBUTING.md)。

[研究方法](docs/methodology.md) · [数据字典](docs/data-dictionary.md) · [更新记录](CHANGELOG.md) · [项目计划](ROADMAP.md)

## 许可与引用

MIT 许可适用于本项目原创代码。第三方报告、标志和引用内容保留原权利；整理数据未另行声明独立再分发许可。使用具体成绩时，请引用原报告并注明运行设置。

```text
CyberAI Observatory. 大模型网络安全评测资料库. 数据截至2026-10-18.
https://github.com/Hongkun16/cyberai-observatory
公开报告证据整理；未独立重跑模型评测。
```
