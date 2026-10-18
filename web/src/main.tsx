import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  Database,
  ExternalLink,
  FileText,
  FlaskConical,
  Github,
  Globe2,
  Layers,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { Audit, Benchmark, Evaluation, Model, Provider } from './types';
import './style.css';

const BASE = import.meta.env.BASE_URL;
const REPOSITORY = 'https://github.com/Hongkun16/cyberai-observatory';
const providers: Provider[] = ['OpenAI', 'Anthropic', 'Google'];
const colors: Record<Provider, string> = {
  OpenAI: '#3867e8',
  Anthropic: '#d58250',
  Google: '#279b8f',
};
const nav = [
  { id: 'overview', en: 'Overview', zh: '总览' },
  { id: 'progress', en: 'Progress', zh: '能力进展' },
  { id: 'models', en: 'Models', zh: '模型库' },
  { id: 'benchmarks', en: 'Benchmarks', zh: '评测库' },
  { id: 'evidence', en: 'Evidence', zh: '证据与方法' },
];
type Route = { view: string; params: URLSearchParams };
function readRoute(): Route {
  const [path, query = ''] = location.hash.slice(1).split('?');
  return {
    view: nav.some((n) => n.id === path) ? path : 'overview',
    params: new URLSearchParams(query),
  };
}
function href(view: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return `#${view}${q ? '?' + q : ''}`;
}
function dateLabel(m: Model) {
  return m.date + (m.date_precision === 'month' ? ' · 月精度' : '');
}
function isLater(r: Evaluation) {
  return /后续|后测|后补/.test(r.configuration + r.note);
}
function statusClass(status: string) {
  return status === '已确认'
    ? 'confirmed'
    : status === '模型覆盖待核对' || status === '未披露具名项目'
      ? 'pending'
      : 'excluded';
}
function Status({ value }: { value: string }) {
  return (
    <span className={`status ${statusClass(value)}`}>
      <span />
      {value}
    </span>
  );
}
function ProviderMark({ value }: { value: Provider }) {
  return (
    <span className="provider">
      <i style={{ background: colors[value] }} />
      {value}
    </span>
  );
}
function External({
  url,
  children,
  className = '',
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={url} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}

function App() {
  const [audit, setAudit] = useState<Audit>();
  const [error, setError] = useState(false);
  const [route, setRoute] = useState(readRoute);
  const [menu, setMenu] = useState(false);
  const viewRef = useRef(route.view);
  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(BASE + 'data/audit.json', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error('load');
        return r.json();
      })
      .then(setAudit)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (viewRef.current !== route.view) {
      window.scrollTo(0, 0);
      viewRef.current = route.view;
    }
    setMenu(false);
    document.title = `${nav.find((n) => n.id === route.view)?.zh} · CyberAI Observatory`;
  }, [route.view]);
  function update(params: Record<string, string | null>) {
    const p = new URLSearchParams(route.params);
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    location.hash = href(route.view, Object.fromEntries(p));
  }
  const select = (record: Evaluation) => update({ record: record.id });
  if (error)
    return (
      <div className="load-state">
        <Activity />
        <h1>数据暂时未能加载</h1>
        <p>请确认通过 HTTP 服务打开网站，然后重试。</p>
        <button className="button primary" onClick={() => location.reload()}>
          重新加载
        </button>
      </div>
    );
  if (!audit)
    return (
      <div className="load-state" role="status">
        <Activity className="pulse" />
        <p>正在载入核验资料…</p>
      </div>
    );
  const selectedId = route.params.get('record');
  const record = audit.evaluations.find((e) => e.id === selectedId);
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        跳到主要内容
      </a>
      <header className="header">
        <div className="header-inner">
          <a href="#overview" className="brand" aria-label="CyberAI Observatory 首页">
            <span className="brand-symbol">
              <Activity size={23} strokeWidth={1.8} />
            </span>
            <span>
              CyberAI<span className="brand-light"> Observatory</span>
              <small>大模型网安进展观察站</small>
            </span>
          </a>
          <nav className={menu ? 'nav open' : 'nav'} aria-label="主要导航">
            {nav.map((n) => (
              <a
                key={n.id}
                href={href(n.id)}
                aria-current={route.view === n.id ? 'page' : undefined}
                className={route.view === n.id ? 'active' : ''}
              >
                {n.en}
                <span>{n.zh}</span>
              </a>
            ))}
          </nav>
          <a className="source-button" href={REPOSITORY} target="_blank" rel="noreferrer">
            <Github size={17} />
            <span>GitHub</span>
          </a>
          <button
            className="menu-button icon-button"
            aria-label={menu ? '关闭导航' : '展开导航'}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="main">
        {route.view === 'overview' && (
          <Overview audit={audit} route={route} update={update} select={select} />
        )}
        {route.view === 'progress' && (
          <Progress audit={audit} route={route} update={update} select={select} />
        )}
        {route.view === 'models' && (
          <Models audit={audit} route={route} update={update} select={select} />
        )}
        {route.view === 'benchmarks' && (
          <Benchmarks audit={audit} route={route} update={update} select={select} />
        )}
        {route.view === 'evidence' && (
          <Evidence audit={audit} route={route} update={update} select={select} />
        )}
      </main>
      <footer className="footer">
        <div>
          <a className="footer-brand" href="#overview">
            <Activity size={19} />
            CyberAI Observatory
          </a>
          <p>公开报告 · 可追溯证据 · 持续观察</p>
        </div>
        <div className="footer-right">
          <span>数据快照 {audit.meta.asOf}</span>
          <a href="#evidence">
            方法与限制 <ArrowUpRight size={13} />
          </a>
          <a href={BASE + 'downloads/results.csv'} download>
            下载 CSV <ArrowDownToLine size={13} />
          </a>
        </div>
      </footer>
      {record && (
        <EvidenceDrawer
          record={record}
          model={audit.models.find((m) => m.id === record.modelId)!}
          close={() => update({ record: null })}
        />
      )}
      {selectedId && !record && (
        <div className="inline-notice" role="status">
          未找到记录 {selectedId} <button onClick={() => update({ record: null })}>关闭</button>
        </div>
      )}
    </>
  );
}

type Shared = {
  audit: Audit;
  route: Route;
  update: (p: Record<string, string | null>) => void;
  select: (r: Evaluation) => void;
};
function PageIntro({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
function SectionTitle({
  number,
  title,
  text,
  link,
  target,
}: {
  number: string;
  title: string;
  text: string;
  link?: string;
  target?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <div className="section-number">{number} / RESEARCH EXPLORER</div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {link && (
        <a className="text-link" href={target}>
          {link}
          <ArrowUpRight size={16} />
        </a>
      )}
    </div>
  );
}

function Overview(props: Shared) {
  const { audit } = props;
  const confirmed = audit.evaluations.filter((e) => e.status === '已确认').length;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> AN OPEN RESEARCH OBSERVATORY{' '}
            <span className="edition">/ VOL. 01</span>
          </div>
          <h1>
            追踪大模型
            <br />
            网络安全能力的<span>演进。</span>
          </h1>
          <p>
            从公开评测到原始证据，理解模型能做什么，
            <br className="desktop-break" />
            以及每一次进步，究竟意味着什么。
          </p>
          <div className="hero-actions">
            <a href="#progress" className="button primary">
              探索能力进展 <ArrowRight size={17} />
            </a>
            <a className="text-link" href="#evidence">
              阅读研究方法 <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="hero-caption">
            <Globe2 size={13} /> OpenAI · Anthropic · Google <span>数据截至 {audit.meta.asOf}</span>
          </div>
        </div>
        <div className="research-note">
          <div className="note-top">
            <span>FIELD NOTES</span>
            <span>2026 / 01</span>
          </div>
          <div className="note-orbit" aria-hidden="true">
            <div className="orbit-ring r1" />
            <div className="orbit-ring r2" />
            <div className="orbit-ring r3" />
            <div className="orbit-center">
              <ShieldCheck size={38} strokeWidth={1.2} />
            </div>
            <i className="orbit-point p1" />
            <i className="orbit-point p2" />
            <i className="orbit-point p3" />
            <span className="orbit-label l1">DISCOVER</span>
            <span className="orbit-label l2">EXPLOIT</span>
            <span className="orbit-label l3">DEFEND</span>
          </div>
          <h3>让能力变化，有据可循。</h3>
          <p>漏洞发现与利用 / 多阶段任务 / 防护与拒答</p>
          <div className="note-bottom">
            <span>REPORTS → EVIDENCE → INSIGHT</span>
            <ArrowUpRight size={18} />
          </div>
        </div>
      </section>
      <section className="stats" aria-label="数据概览">
        {[
          { n: audit.models.length, label: '模型与版本快照', en: 'MODEL SNAPSHOTS' },
          { n: audit.evaluations.length, label: '逐项评测记录', en: 'EVALUATION RECORDS' },
          { n: confirmed, label: '证据归属已确认', en: 'CONFIRMED RECORDS' },
          { n: audit.meta.scoreCount, label: '含原文成绩的记录', en: 'REPORTED SCORES' },
        ].map((s) => (
          <div className="stat" key={s.en}>
            <span>{s.en}</span>
            <strong>
              {s.n}
              <i>↗</i>
            </strong>
            <p>{s.label}</p>
          </div>
        ))}
      </section>
      <section className="section">
        <SectionTitle
          number="01"
          title="能力的变化，放到时间里看。"
          text="选择一个评测，探索公开成绩与模型版本之间的关系。"
          link="进入完整探索"
          target="#progress"
        />
        <TrendChart {...props} />
      </section>
      <section className="section">
        <SectionTitle
          number="02"
          title="先看懂证据，再解读进步。"
          text="阅读这份资料时，三个值得保留的观察角度。"
        />
        <div className="insight-grid">
          <a className="insight" href="#benchmarks?search=Exploit">
            <div className="insight-top">
              <span className="tag">任务维度</span>
              <Layers size={21} />
            </div>
            <h3>从解题到漏洞研究</h3>
            <p>
              CTF、真实漏洞利用、仓库修复与多阶段靶场，测量的是不同能力。先了解任务，再比较表现。
            </p>
            <span className="insight-link">
              探索评测类型 <ArrowUpRight size={17} />
            </span>
          </a>
          <a className="insight" href="#evidence?status=模型覆盖待核对">
            <div className="insight-top">
              <span className="tag">证据边界</span>
              <CircleHelp size={21} />
            </div>
            <h3>没有记录，不代表没有测试</h3>
            <p>37 条记录保留了待核、未披露、未运行等不同状态。报告共用，也不意味着结果可以共用。</p>
            <span className="insight-link">
              查看待核与排除 <ArrowUpRight size={17} />
            </span>
          </a>
          <a className="insight" href="#evidence?category=防护/鲁棒性">
            <div className="insight-top">
              <span className="tag">测量口径</span>
              <ShieldCheck size={21} />
            </div>
            <h3>能力与防护，分别观察</h3>
            <p>任务成功率、越狱防护与请求响应率各有含义。是否关闭防护，也会影响测试结果的解读。</p>
            <span className="insight-link">
              查看防护与拒答 <ArrowUpRight size={17} />
            </span>
          </a>
        </div>
      </section>
      <section className="section">
        <SectionTitle
          number="03"
          title="哪些能力，有公开证据？"
          text="查看模型与评测的对应关系。覆盖范围不等于能力高低。"
          link="浏览全部模型"
          target="#models"
        />
        <Coverage audit={audit} select={props.select} compact />
      </section>
      <section className="section updates-section">
        <div>
          <div className="section-number">04 / RESEARCH LOG</div>
          <h2>
            每一次修订，
            <br />
            也留下记录。
          </h2>
          <p>
            保留补齐、纠正与证据限制。
            <br />
            让结论的来路可以被复核。
          </p>
          <a className="text-link" href="#evidence?section=changes">
            查看全部修订 <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="update-list">
          {audit.revisions.slice(0, 3).map((r, i) => (
            <a
              href={href('evidence', { search: r.subject.split(' / ')[0].replace('GPT-', 'GPT-') })}
              key={r.subject}
            >
              <span className="update-index">0{i + 1}</span>
              <div>
                <span className="update-label">
                  {audit.meta.asOf} <span>资料核验</span>
                </span>
                <h3>{r.subject}</h3>
                <p>{r.change}</p>
              </div>
              <ArrowUpRight size={17} />
            </a>
          ))}
        </div>
      </section>
      <div className="download-banner">
        <span className="download-icon">
          <Database size={27} />
        </span>
        <div>
          <h3>把证据带进你的研究。</h3>
          <p>下载完整核验表，或使用结构化 JSON 与 CSV。</p>
        </div>
        <a className="button secondary" href={BASE + 'downloads/audit-2026-10-17.xlsx'} download>
          下载 Excel <ArrowDownToLine size={16} />
        </a>
        <a className="text-link" href={BASE + 'data/audit.json'} download>
          JSON <ArrowUpRight size={15} />
        </a>
      </div>
    </>
  );
}

function TrendChart({ audit, route, update, select }: Shared) {
  const benchmark = route.params.get('benchmark') || 'ExploitBench';
  const provider = route.params.get('provider') || 'all';
  const modelMap = useMemo(() => new Map(audit.models.map((m) => [m.id, m])), [audit]);
  const [hover, setHover] = useState<string | null>(null);
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)');
    const listener = () => setCompact(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  const options = [
    ...new Set(
      audit.evaluations
        .filter((r) => r.category === '能力' && r.numericScore !== null)
        .map((r) => r.benchmark),
    ),
  ].sort();
  const all = audit.evaluations.filter(
    (r) =>
      r.benchmark === benchmark &&
      r.status === '已确认' &&
      r.category === '能力' &&
      (provider === 'all' || modelMap.get(r.modelId)?.provider === provider),
  );
  const points = all.filter(
    (r) => r.numericScore !== null && modelMap.get(r.modelId)?.date_precision === 'day',
  );
  const months = all.filter(
    (r) => r.numericScore !== null && modelMap.get(r.modelId)?.date_precision === 'month',
  );
  const dates = audit.evaluations
    .filter((r) => r.benchmark === benchmark && r.category === '能力' && r.numericScore !== null)
    .map((r) => modelMap.get(r.modelId)!.date.slice(0, 7))
    .sort();
  const firstMonth = dates[0] || audit.meta.asOf.slice(0, 7),
    lastMonth = dates.at(-1) || firstMonth;
  const lo = Date.parse(firstMonth + '-01'),
    last = new Date(lastMonth + '-01T00:00:00Z');
  const hi = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 0);
  const ticks = Array.from(
    { length: compact ? 4 : 5 },
    (_, i) => lo + ((hi - lo) * i) / (compact ? 3 : 4),
  );
  const width = compact ? 600 : 920,
    right = width - 65;
  const x = (d: string | number) =>
    70 + (((typeof d === 'number' ? d : Date.parse(d)) - lo) / (hi - lo)) * (right - 70);
  const y = (n: number) => 260 - n * 2.12;
  const active = points.find((p) => p.id === hover);
  const bench = audit.benchmarks.find((b) => b.name === benchmark);
  return (
    <div className="chart-panel">
      <div className="chart-toolbar">
        <div className="chart-select">
          <label htmlFor="trend-benchmark">BENCHMARK</label>
          <div className="select-wrap">
            <select
              id="trend-benchmark"
              value={options.includes(benchmark) ? benchmark : ''}
              onChange={(e) => {
                setHover(null);
                update({ benchmark: e.target.value });
              }}
            >
              {!options.includes(benchmark) && <option value="">选择可绘图评测</option>}
              {options.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
        <div className="provider-filters" aria-label="筛选厂商">
          {['all', ...providers].map((p) => (
            <button
              key={p}
              aria-pressed={provider === p}
              className={provider === p ? 'selected' : ''}
              onClick={() => {
                setHover(null);
                update({ provider: p === 'all' ? null : p });
              }}
            >
              {p !== 'all' && <i style={{ background: colors[p as Provider] }} />}
              {p === 'all' ? '全部厂商' : p}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-title">
        <div>
          <h3>
            {benchmark}
            <span>公开成绩 · 时间分布</span>
          </h3>
          <p>{bench?.task || '从评测库选择一个项目，查看相关证据。'}</p>
        </div>
        <span className="chart-mode">
          <span />
          独立数据点
        </span>
      </div>
      <div className="plot-scroll">
        <svg
          className="plot"
          viewBox={`0 0 ${width} 320`}
          role="group"
          aria-label={`${benchmark}公开成绩时间散点图。每个数据点可用键盘选择。`}
        >
          <text x="28" y="22" className="axis-title">
            原文百分数 (%)
          </text>
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1="70" x2={right} y1={y(t)} y2={y(t)} className="grid-line" />
              <text x="49" y={y(t) + 4} textAnchor="end" className="axis-label">
                {t}
              </text>
            </g>
          ))}
          {ticks.map((t, i) => {
            const date = new Date(t);
            return (
              <g key={t}>
                <text
                  x={x(t)}
                  y="291"
                  textAnchor={i === ticks.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
                  className="axis-label"
                >
                  {date.getUTCMonth() + 1}月
                  {hi - lo < 120 * 86400000 ? `${date.getUTCDate()}日` : ''}
                </text>
              </g>
            );
          })}
          <text x={right} y="313" textAnchor="end" className="axis-title">
            模型日期 / {audit.meta.asOf.slice(0, 4)}
          </text>
          {points.map((r) => {
            const m = modelMap.get(r.modelId)!;
            const cx = x(m.date),
              cy = y(r.numericScore!);
            return (
              <g
                key={r.id}
                className="data-point"
                role="button"
                tabIndex={0}
                aria-label={`${m.name}，${r.score}，${m.date}。打开原文证据`}
                onMouseEnter={() => setHover(r.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(r.id)}
                onBlur={() => setHover(null)}
                onClick={() => select(r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(r);
                  }
                }}
              >
                <circle
                  className="point-halo"
                  cx={cx}
                  cy={cy}
                  r={hover === r.id ? 14 : 10}
                  fill={colors[m.provider]}
                  opacity={hover === r.id ? 0.14 : 0.07}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={hover === r.id ? 6.5 : compact ? 7 : 5}
                  fill={colors[m.provider]}
                  stroke="white"
                  strokeWidth="2"
                />
                <title>
                  {m.name} · {r.score} · {m.date}
                </title>
                {points.length < 8 && !compact && (
                  <text
                    x={Math.min(right - 30, Math.max(110, cx))}
                    y={cy > 70 ? cy - 17 : cy + 23}
                    textAnchor="middle"
                    className="point-label"
                  >
                    {m.name.replace(' / GPT-5.5 Thinking', '').replace(' / GPT-5.4 Thinking', '')}
                  </text>
                )}
              </g>
            );
          })}
          {!points.length && (
            <text x={width / 2} y="153" textAnchor="middle" className="empty-chart">
              当前筛选下，没有日精度、单一百分数的能力成绩
            </text>
          )}
        </svg>
      </div>
      <div className="chart-readout" aria-live="polite">
        {active ? (
          <>
            <ProviderMark value={modelMap.get(active.modelId)!.provider} />
            <strong>{modelMap.get(active.modelId)!.name}</strong>
            <span>{active.score}</span>
            <span className="readout-config">{active.configuration}</span>
            <button onClick={() => select(active)}>
              查看证据 <ArrowRight size={13} />
            </button>
          </>
        ) : (
          <>
            <span className="readout-hint">
              <span className="cursor-icon">↖</span>悬停查看模型，点击数据点打开原文证据
            </span>
            <span>{points.length} 个数据点</span>
          </>
        )}
      </div>
      {months.length > 0 && (
        <div className="month-records">
          <span>仅有月精度，单独列示：</span>
          {months.map((r) => (
            <button key={r.id} onClick={() => select(r)}>
              <i style={{ background: colors[modelMap.get(r.modelId)!.provider] }} />
              {modelMap.get(r.modelId)!.name} <strong>{r.score}</strong>
              <span>{modelMap.get(r.modelId)!.date}</span>
              <ArrowUpRight size={12} />
            </button>
          ))}
        </div>
      )}
      <div className="chart-footnote">
        <CircleHelp size={15} />
        <p>
          同名评测的题集、指标与预算可能不同，数据点不连线、不作综合排名。横轴为模型日期，后续补测见证据；混合指标保留原文，不强行换算。
          {all.some((r) => r.numericScore === null) && (
            <span>
              {' '}
              当前另有 {all.filter((r) => r.numericScore === null).length}{' '}
              条非单一百分数成绩或未填成绩，见记录表。
            </span>
          )}
        </p>
        <a href="#evidence?section=method">
          比较口径 <ArrowUpRight size={12} />
        </a>
      </div>
    </div>
  );
}

function Progress(props: Shared) {
  const { audit, route, update } = props;
  const benchmark = route.params.get('benchmark') || 'ExploitBench';
  const provider = route.params.get('provider') || 'all';
  const records = audit.evaluations.filter(
    (r) =>
      r.benchmark === benchmark &&
      (provider === 'all' || audit.models.find((m) => m.id === r.modelId)?.provider === provider),
  );
  return (
    <>
      <PageIntro
        eyebrow="PROGRESS / 能力进展"
        title="把成绩放回时间与条件中。"
        text="保留每个结果的原始指标与运行设置，逐项理解变化。"
        action={
          <a className="button secondary" href={BASE + 'downloads/results.csv'} download>
            下载数据 <ArrowDownToLine size={16} />
          </a>
        }
      />
      <TrendChart {...props} />
      <div className="section">
        <SectionTitle
          number="01"
          title={`${benchmark} · 逐项记录`}
          text="包含未填成绩和待核记录。点击一行查看完整证据。"
        />
        <RecordTable records={records} audit={audit} select={props.select} />
      </div>
      <div className="reading-note">
        <FlaskConical size={23} />
        <div>
          <h3>什么样的数据，才能说明“进步”？</h3>
          <p>
            同一题集版本、指标、运行预算、工具环境和防护配置下的历史对照，才适合直接比较。目前所有记录的可比组仍待人工核定，因此以独立数据点呈现。后续会优先补充同一报告里的历史重跑成绩。
          </p>
          <button
            className="text-link"
            onClick={() => update({ benchmark: 'CyberGym', provider: null })}
          >
            也看看 CyberGym <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

function SearchBox({
  value,
  change,
  placeholder,
}: {
  value: string;
  change: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-box">
      <Search size={17} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => change(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className="icon-button"
          aria-label="清空搜索"
          onClick={() => change('')}
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Search size={25} />
      <h3>没有找到匹配结果</h3>
      <p>{text}</p>
    </div>
  );
}
function RecordTable({
  records,
  audit,
  select,
}: {
  records: Evaluation[];
  audit: Audit;
  select: (r: Evaluation) => void;
}) {
  if (!records.length) return <Empty text="试试其他关键词或筛选条件。" />;
  const map = new Map(audit.models.map((m) => [m.id, m]));
  return (
    <div className="table-scroll">
      <table className="record-table">
        <thead>
          <tr>
            <th>模型 / 评测</th>
            <th>原文成绩</th>
            <th>证据状态</th>
            <th>类别</th>
            <th>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>
                <button className="row-main" onClick={() => select(r)}>
                  {map.get(r.modelId)?.name}
                  <span>{r.benchmark}</span>
                </button>
              </td>
              <td className="score-cell">
                {r.score || <span className="muted">未填成绩</span>}
                {isLater(r) && <small className="later-tag">后续补测</small>}
              </td>
              <td>
                <Status value={r.status} />
              </td>
              <td className="category-cell">{r.category}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`查看 ${r.id} 证据`}
                  onClick={() => select(r)}
                >
                  <ArrowUpRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const matrixBenchmarks = [
  'ExploitBench',
  'ExploitGym',
  'CyberGym',
  'SEC-Bench Pro',
  'CVE-Bench',
  'CyScenarioBench',
  'Cybench',
];
function Coverage({
  audit,
  select,
  compact = false,
}: {
  audit: Audit;
  select: (r: Evaluation) => void;
  compact?: boolean;
}) {
  const ids = [
    'gpt-6-1-sol',
    'gpt-5-5-cyber',
    'claude-opus-5-5',
    'claude-sonnet-5-5',
    'gemini-4-argon',
    'gemini-3-7-flash',
  ];
  const models = compact
    ? ids.map((id) => audit.models.find((m) => m.id === id)!).filter(Boolean)
    : audit.models;
  return (
    <div className="coverage-panel">
      <div className="coverage-header">
        <span>
          <Layers size={15} /> EVALUATION COVERAGE
        </span>
        <div className="matrix-legend">
          <span>
            <b className="cell-confirmed">●</b>确认
          </span>
          <span>
            <b className="cell-later">◇</b>后续补测
          </span>
          <span>
            <b className="cell-pending">◐</b>待核 / 未披露
          </span>
          <span>
            <b className="cell-excluded">×</b>未运行 / 排除
          </span>
          <span>— 无记录</span>
        </div>
      </div>
      <div className="table-scroll">
        <table className="matrix">
          <thead>
            <tr>
              <th>模型 / MODEL</th>
              {matrixBenchmarks.map((b) => (
                <th key={b}>{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id}>
                <th>
                  <a href={href('models', { model: m.id })}>
                    <i style={{ background: colors[m.provider] }} />
                    {m.name}
                  </a>
                </th>
                {matrixBenchmarks.map((b) => {
                  const records = audit.evaluations.filter(
                    (r) => r.modelId === m.id && r.benchmark === b,
                  );
                  const r =
                    records.find((e) => e.category === '能力' && e.status === '已确认') ||
                    records.find((e) => e.category === '能力') ||
                    records[0];
                  const later = r && isLater(r) && r.status === '已确认';
                  const cls = r
                    ? later
                      ? 'cell-later'
                      : 'cell-' + statusClass(r.status)
                    : 'cell-empty';
                  const symbol = !r
                    ? '—'
                    : later
                      ? '◇'
                      : r.status === '已确认'
                        ? '●'
                        : statusClass(r.status) === 'pending'
                          ? '◐'
                          : '×';
                  return (
                    <td key={b}>
                      {r ? (
                        <button
                          className={`matrix-cell ${cls}`}
                          title={`${m.name} / ${b}：${r.status}${later ? '，后续补测' : ''}；${r.category}`}
                          aria-label={`${m.name}，${b}，${r.status}${later ? '，后续补测' : ''}，${r.category}`}
                          onClick={() => select(r)}
                        >
                          {symbol}
                        </button>
                      ) : (
                        <span className="cell-empty" aria-label="无对应记录">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="matrix-foot">
        {compact ? '精选模型 · ' : ''}
        符号表示证据状态，不表示能力高低；同一模型存在多类记录时优先显示能力证据。完整记录见模型档案。
      </div>
    </div>
  );
}

function Models({ audit, route, update, select }: Shared) {
  const [layout, setLayout] = useState('cards');
  const search = route.params.get('search') || '',
    provider = route.params.get('provider') || 'all';
  const selected = audit.models.find((m) => m.id === route.params.get('model'));
  const filtered = audit.models.filter(
    (m) =>
      (provider === 'all' || m.provider === provider) &&
      `${m.name} ${m.id} ${m.role}`.toLowerCase().includes(search.toLowerCase()),
  );
  if (selected) {
    const records = audit.evaluations.filter((r) => r.modelId === selected.id);
    return (
      <>
        <a href="#models" className="back-link">
          <ArrowLeft size={15} />
          全部模型
        </a>
        <PageIntro
          eyebrow={`${selected.provider.toUpperCase()} / MODEL PROFILE`}
          title={selected.name}
          text={selected.role}
          action={
            <External className="button secondary" url={selected.sourceUrl}>
              官方报告
            </External>
          }
        />
        <div className="model-facts">
          <div>
            <span>模型日期</span>
            <strong>{dateLabel(selected)}</strong>
          </div>
          <div>
            <span>报告类型</span>
            <strong>{selected.reportType}</strong>
          </div>
          <div>
            <span>已确认记录</span>
            <strong>
              {records.filter((r) => r.status === '已确认').length} / {records.length}
            </strong>
          </div>
          <div>
            <span>主文档</span>
            <strong>
              {selected.pdfPages} 页 · {selected.pdfKind}
            </strong>
          </div>
        </div>
        <div className="profile-notes">
          <FileText size={20} />
          <div>
            <p>
              <strong>日期证据：</strong>
              {selected.dateEvidence}。{selected.dateNote}
            </p>
            <p>
              <strong>归属与限制：</strong>
              {selected.caveats}
            </p>
            {selected.conclusion && <p>{selected.conclusion}</p>}
          </div>
        </div>
        <SectionTitle
          number="01"
          title="评测与证据"
          text="原始报告项目与后续补测分别保留，能力、防护和拒答记录分别标注。"
        />
        <RecordTable records={records} audit={audit} select={select} />
      </>
    );
  }
  return (
    <>
      <PageIntro
        eyebrow="MODELS / 模型库"
        title="每一个模型，都有自己的证据档案。"
        text="覆盖三家厂商的 48 个模型与版本快照；共用报告、版本更新和补测分别记录。"
      />
      <div className="filter-bar">
        <SearchBox
          value={search}
          change={(v) => update({ search: v || null })}
          placeholder="搜索模型名称、版本或定位…"
        />
        <select
          aria-label="筛选模型厂商"
          value={provider}
          onChange={(e) => update({ provider: e.target.value === 'all' ? null : e.target.value })}
        >
          <option value="all">全部厂商</option>
          {providers.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <span className="result-count">{filtered.length} 个模型</span>
        <div className="view-switch">
          <button
            className={layout === 'cards' ? 'active' : ''}
            aria-pressed={layout === 'cards'}
            onClick={() => setLayout('cards')}
          >
            档案
          </button>
          <button
            className={layout === 'matrix' ? 'active' : ''}
            aria-pressed={layout === 'matrix'}
            onClick={() => setLayout('matrix')}
          >
            矩阵
          </button>
        </div>
      </div>
      {!filtered.length ? (
        <Empty text="试试其他模型名称或厂商。" />
      ) : layout === 'matrix' ? (
        <Coverage audit={{ ...audit, models: filtered }} select={select} />
      ) : (
        <div className="model-grid">
          {filtered.map((m) => {
            const records = audit.evaluations.filter((r) => r.modelId === m.id);
            return (
              <a className="model-card" href={href('models', { model: m.id })} key={m.id}>
                <div className="model-card-top">
                  <ProviderMark value={m.provider} />
                  <span>{m.date}</span>
                </div>
                <h2>{m.name}</h2>
                <p>{m.role}</p>
                <div className="model-card-meta">
                  <span>
                    <CheckCircle2 size={14} />
                    {records.filter((r) => r.status === '已确认').length} 条确认
                  </span>
                  <span>{records.length} 条记录</span>
                  <ArrowUpRight size={17} />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}

function Benchmarks({ audit, route, update, select }: Shared) {
  const search = route.params.get('search') || '';
  const selected = audit.benchmarks.find((b) => b.name === route.params.get('benchmark'));
  const counts = (b: Benchmark) => audit.evaluations.filter((r) => r.benchmark === b.name).length;
  const filtered = [...audit.benchmarks]
    .filter((b) => `${b.name} ${b.task} ${b.openness}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => counts(b) - counts(a));
  if (selected) {
    const records = audit.evaluations.filter((r) => r.benchmark === selected.name);
    return (
      <>
        <a className="back-link" href="#benchmarks">
          <ArrowLeft size={15} />
          全部评测
        </a>
        <PageIntro
          eyebrow="BENCHMARK / 评测档案"
          title={selected.name}
          text={selected.task}
          action={
            <External className="button secondary" url={selected.sourceUrl}>
              定义来源
            </External>
          }
        />
        <div className="reading-note">
          <BookOpen size={23} />
          <div>
            <h3>{selected.openness}</h3>
            <p>{selected.caveat}</p>
          </div>
        </div>
        <SectionTitle
          number="01"
          title="相关模型与记录"
          text={`${records.length} 条记录。评测名称相同，不代表版本和运行条件相同。`}
        />
        <RecordTable records={records} audit={audit} select={select} />
      </>
    );
  }
  return (
    <>
      <PageIntro
        eyebrow="BENCHMARKS / 评测库"
        title="理解分数，从理解任务开始。"
        text="公开基准、私有测试集与描述性任务标签各有边界。这里保留它们的定义和设置限制。"
      />
      <div className="filter-bar">
        <SearchBox
          value={search}
          change={(v) => update({ search: v || null })}
          placeholder="搜索评测名称、任务或开放性…"
        />
        <span className="result-count">{filtered.length} 个评测 / 任务标签</span>
      </div>
      {!filtered.length ? (
        <Empty text="试试漏洞、CTF、利用、修复或 Exploit。" />
      ) : (
        <div className="benchmark-list">
          {filtered.map((b) => (
            <a
              className="benchmark-card"
              href={href('benchmarks', { benchmark: b.name })}
              key={b.name}
            >
              <div className="benchmark-icon">
                <FlaskConical size={22} />
              </div>
              <div>
                <div className="benchmark-title">
                  <h2>{b.name}</h2>
                  <span>{counts(b)} 条记录</span>
                </div>
                <p>{b.task}</p>
                <span className="benchmark-openness">{b.openness}</span>
              </div>
              <ArrowUpRight size={20} />
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function Evidence({ audit, route, update, select }: Shared) {
  const section = route.params.get('section') || 'records';
  const search = route.params.get('search') || '',
    status = route.params.get('status') || 'all',
    category = route.params.get('category') || 'all';
  const modelMap = new Map(audit.models.map((m) => [m.id, m]));
  const records = audit.evaluations.filter(
    (r) =>
      (status === 'all' || r.status === status) &&
      (category === 'all' || r.category === category) &&
      `${r.id} ${r.benchmark} ${modelMap.get(r.modelId)?.name} ${r.configuration} ${r.note}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const sections = [
    { id: 'records', label: '证据记录', icon: Database },
    { id: 'method', label: '方法与边界', icon: BookOpen },
    { id: 'changes', label: '修订记录', icon: FileText },
    { id: 'repository', label: '源码与下载', icon: Code2 },
  ];
  return (
    <>
      <PageIntro
        eyebrow="EVIDENCE / 证据与方法"
        title="每一个结论，都应该能找到来处。"
        text="核验快照 2026-10-17。这里记录来源、配置、证据归属与尚未解决的问题。"
      />
      <div className="tabs" aria-label="证据页面分类">
        {sections.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? 'active' : ''}
            aria-pressed={section === s.id}
            onClick={() => update({ section: s.id })}
          >
            <s.icon size={16} />
            {s.label}
          </button>
        ))}
      </div>
      {section === 'records' && (
        <>
          <div className="filter-bar evidence-filters">
            <SearchBox
              value={search}
              change={(v) => update({ search: v || null })}
              placeholder="搜索模型、评测、配置或记录 ID…"
            />
            <select
              aria-label="筛选证据状态"
              value={status}
              onChange={(e) => update({ status: e.target.value === 'all' ? null : e.target.value })}
            >
              <option value="all">全部证据状态</option>
              {[...new Set(audit.evaluations.map((r) => r.status))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="筛选记录类别"
              value={category}
              onChange={(e) =>
                update({ category: e.target.value === 'all' ? null : e.target.value })
              }
            >
              <option value="all">全部类别</option>
              {[...new Set(audit.evaluations.map((r) => r.category))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="result-count">{records.length} 条记录</span>
          </div>
          <RecordTable records={records} audit={audit} select={select} />
        </>
      )}
      {section === 'method' && (
        <div className="method-layout">
          <div className="method-prose">
            <div className="eyebrow">METHODOLOGY / V0.1</div>
            <h2>一份公开报告的证据地图。</h2>
            <p className="lead">
              本项目整理公开报告中的网安评测信息，未独立重跑模型，也未对所有结论做独立复现。
            </p>
            <h3>01 · 数据从哪里来</h3>
            <p>
              当前数据由《模型网安评测核验.xlsx》导入，包含 {audit.models.length} 个模型快照与{' '}
              {audit.evaluations.length} 条记录。主文档和补充资料共 {audit.pdfs.length} 份
              PDF；原始报告与网页转制文件分别标识。访问失败日志同样保留。
            </p>
            <h3>02 · “已确认”确认的是什么</h3>
            <p>
              确认的是报告正文或图表明确支持该模型与该项测试的对应关系。它不表示全部任务成功，也不表示已经独立复现。共用报告不自动继承结果；模型覆盖不足、明确未运行、停止报告和仅方法引用分别标注。
            </p>
            <h3>03 · 如何解释时间图</h3>
            <p>
              横轴使用模型日期，而非成绩披露日期；后续补测在记录里标注。月精度日期仅显示到月份，在图下单列，不伪造具体日期。发布日、开放日和报告日期可能不同，模型档案保留日期证据和口径。
            </p>
            <h3>04 · 如何处理成绩</h3>
            <p>
              43 条记录包含原文成绩，其中 {audit.meta.numericCount}{' '}
              条为可直接解析的单一百分数。次数、比值、区间、多指标和带限定条件的复合成绩保留原文。图表只显示能力类、已确认、单一百分数记录；这并不使它们自动可比。
            </p>
            <h3>05 · 比较必须满足的条件</h3>
            <p>
              题集版本、子集、指标、采样次数、时间与计算预算、工具环境、judge
              和防护开关均可能影响结果。当前未核定可比组，所以不连线、不计算综合排名，也不把覆盖项目增加解释为能力提升。
            </p>
            <h3>06 · 哪些仍需补齐</h3>
            <p>
              优先补充同一报告中、相同设置下的历史模型重跑结果；另行记录模型快照日期、成绩报告日期与实际运行配置。核定可比组后再增加趋势线。任何新增记录都需要官方来源和可定位证据。
            </p>
            <h3>07 · 文件与权利</h3>
            <p>
              报告版权属于原权利人。本站提供来源链接及归档哈希，不将第三方报告纳入代码许可。仓库中的
              MIT 许可仅适用于本项目原创代码；整理数据的独立再分发许可暂未声明。
            </p>
          </div>
          <aside className="method-aside">
            <span className="eyebrow">AUDIT SNAPSHOT</span>
            <strong>{audit.meta.asOf}</strong>
            <dl>
              <div>
                <dt>模型快照</dt>
                <dd>{audit.models.length}</dd>
              </div>
              <div>
                <dt>证据记录</dt>
                <dd>{audit.evaluations.length}</dd>
              </div>
              <div>
                <dt>PDF 目录</dt>
                <dd>{audit.pdfs.length}</dd>
              </div>
              <div>
                <dt>访问记录</dt>
                <dd>{audit.sources.length}</dd>
              </div>
            </dl>
            <a
              className="button secondary"
              href={BASE + 'downloads/audit-2026-10-17.xlsx'}
              download
            >
              下载原始核验表 <ArrowDownToLine size={15} />
            </a>
          </aside>
        </div>
      )}
      {section === 'changes' && (
        <div className="revision-list">
          {audit.revisions.map((r, i) => (
            <article key={r.subject}>
              <div className="revision-date">
                <span>{audit.meta.asOf}</span>
                <small>REV. {String(i + 1).padStart(2, '0')}</small>
              </div>
              <div>
                <h2>{r.subject}</h2>
                <p className="revision-before">原表：{r.before}</p>
                <p>{r.change}</p>
                <External className="text-link" url={r.sourceUrl}>
                  核对原文 · {r.pages}
                </External>
              </div>
            </article>
          ))}
        </div>
      )}
      {section === 'repository' && (
        <div className="repository-content">
          <div className="repo-hero">
            <Github size={35} />
            <h2>开放源码，可复核的数据流程。</h2>
            <p>Excel → 结构化数据 → 校验 → 静态网站</p>
            <div className="local-repo-note">
              <Code2 size={17} />
              <External className="text-link" url={REPOSITORY}>
                Hongkun16 / cyberai-observatory · 浏览源码与提交修订
              </External>
            </div>
          </div>
          <div className="download-grid">
            {[
              {
                file: 'downloads/audit-2026-10-17.xlsx',
                name: 'Excel 核验工作簿',
                text: '10 张工作表 · 完整核验快照',
                icon: FileText,
              },
              {
                file: 'downloads/results.csv',
                name: 'CSV 逐项记录',
                text: '233 条记录 · 适合表格分析',
                icon: Database,
              },
              {
                file: 'data/audit.json',
                name: 'JSON 完整数据',
                text: '模型、评测、来源与修订',
                icon: Code2,
              },
            ].map((d) => (
              <a className="download-card" key={d.file} href={BASE + d.file} download>
                <d.icon size={25} />
                <h3>{d.name}</h3>
                <p>{d.text}</p>
                <span>
                  下载文件 <ArrowDownToLine size={15} />
                </span>
              </a>
            ))}
          </div>
          <div className="hash-note">
            <span>源工作簿 SHA-256</span>
            <code>{audit.meta.workbookSha256}</code>
          </div>
          <h3>引用这份快照</h3>
          <pre className="citation">
            CyberAI Observatory. 模型网安评测核验快照. {audit.meta.asOf}.<br />
            公开报告证据整理；未独立重跑模型评测。
          </pre>
        </div>
      )}
    </>
  );
}

function EvidenceDrawer({
  record: r,
  model,
  close,
}: {
  record: Evaluation;
  model: Model;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    setCopied(false);
  }, [r.id]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="evidence-drawer"
      aria-labelledby="drawer-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            close();
        }
      }}
    >
      <div className="drawer-inner">
        <div className="drawer-header">
          <span>
            <FileText size={16} /> EVIDENCE RECORD
          </span>
          <button className="icon-button" aria-label="关闭证据面板" onClick={close}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">
          <span className="record-id">{r.id}</span>
          <h2 id="drawer-title">{r.benchmark}</h2>
          <a className="drawer-model" href={href('models', { model: model.id })}>
            <ProviderMark value={model.provider} />
            {model.name}
            <ArrowUpRight size={15} />
          </a>
          <div className="drawer-status">
            <Status value={r.status} />
            <span className="tag">{r.category}</span>
            {isLater(r) && <span className="tag">后续补测</span>}
          </div>
          <div className="reported-score">
            <span>原文成绩 / REPORTED RESULT</span>
            <strong>{r.score || '未填成绩'}</strong>
            <p>保留原文指标，不换算为统一能力分。</p>
          </div>
          <dl className="evidence-details">
            <div>
              <dt>运行配置与指标口径</dt>
              <dd>{r.configuration || '原表未另列配置'}</dd>
            </div>
            <div>
              <dt>章节 / 表图</dt>
              <dd>{r.section || '见原报告'}</dd>
            </div>
            <div>
              <dt>PDF 文件页码</dt>
              <dd>
                {r.pages || '见原报告'}
                <small>从文件第一页计数，可能与页脚编号不同。</small>
              </dd>
            </div>
            <div>
              <dt>来源性质</dt>
              <dd>{r.sourceKind}</dd>
            </div>
            <div>
              <dt>模型日期</dt>
              <dd>
                {dateLabel(model)}
                <small>{model.dateNote}；后续补测不等于原始发布快照。</small>
              </dd>
            </div>
            {r.note && (
              <div>
                <dt>核验备注</dt>
                <dd>{r.note}</dd>
              </div>
            )}
            <div>
              <dt>归档文件</dt>
              <dd>
                <code>{r.pdfPath}</code>
                <small>文件名用于匹配资料包。网页通过下方链接访问官方来源。</small>
              </dd>
            </div>
          </dl>
          <div className="drawer-links">
            <External className="button primary" url={r.sourceUrl}>
              打开官方来源
            </External>
            <External className="button secondary" url={r.pdfUrl}>
              打开证据文档
            </External>
          </div>
          <button className="copy-button" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? '已复制证据链接' : '复制这条证据的链接'}
          </button>
          <div className="evidence-boundary">
            <ShieldCheck size={17} />
            <p>“已确认”指模型与测试的证据归属。不同设置的结果仍需分别解读；本站未独立复现。</p>
          </div>
        </div>
      </div>
    </dialog>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
