import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  ArrowDown,
  Download,
  Github,
  Menu,
  Search,
  X,
  ChevronRight,
  Copy,
} from 'lucide-react';
import type { Audit, Evaluation, Provider } from './types';
import {
  CREATORS,
  COLORS,
  CREATOR_LABELS,
  configuration,
  familiesFor,
  modelName,
  numberText,
  resultsFor,
  scoreSummary,
  sourceLink,
  type Family,
  type Result,
} from './results';
import './style.css';
const BASE = import.meta.env.BASE_URL,
  REPO = 'https://github.com/Hongkun16/cyberai-observatory';
const NAV = [
  ['overview', '能力对比'],
  ['progress', '进展趋势'],
  ['models', '模型'],
  ['benchmarks', '评测'],
];
function route() {
  const [view, query] = location.hash.slice(1).split('?');
  return {
    view: NAV.some(([v]) => v === view) ? view : 'overview',
    params: new URLSearchParams(query),
  };
}
function href(view: string, params: Record<string, string> = {}) {
  const p = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  return '#' + view + (p.size ? '?' + p : '');
}
function Creator({ name }: { name: Provider }) {
  return (
    <span className="creator">
      <span className={'creator-icon ' + name.toLowerCase()}>
        {name === 'OpenAI' ? '◈' : name[0]}
      </span>
      {CREATOR_LABELS[name]}
    </span>
  );
}
function External({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
function SearchBox({
  value,
  onChange,
  placeholder = 'Filter models, e.g. GPT, Claude…',
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search">
      <Search size={15} />
      <input
        aria-label={placeholder}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="清除搜索" onClick={() => onChange('')}>
          <X size={14} />
        </button>
      )}
    </label>
  );
}
function Intro({
  title,
  eyebrow,
  heading,
  children,
  meta,
}: {
  title: React.ReactNode;
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="intro-background">
      <section className="intro container">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
        </div>
        <div className="intro-copy">
          <h2>{heading}</h2>
          {children}
        </div>
        {meta && <div className="dataset-line">{meta}</div>}
      </section>
    </div>
  );
}
function App() {
  const [data, setData] = useState<Audit>();
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(route);
  const [menu, setMenu] = useState(false);
  const previous = useRef(current.view);
  useEffect(() => {
    fetch(BASE + 'data/audit.json?v=' + __DATA_VERSION__, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw Error('数据加载失败');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
    const fn = () => {
      setCurrent(route());
      setMenu(false);
    };
    addEventListener('hashchange', fn);
    return () => removeEventListener('hashchange', fn);
  }, []);
  useEffect(() => {
    document.title = (NAV.find(([v]) => v === current.view)?.[1] || '') + ' | CyberAI Analysis';
    if (previous.current !== current.view) {
      window.scrollTo(0, 0);
      previous.current = current.view;
    }
  }, [current.view]);
  function update(changes: Record<string, string>) {
    const next = route();
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.params.set(k, v);
      else next.params.delete(k);
    }
    location.hash = next.view + (next.params.size ? '?' + next.params : '');
  }
  const record = data?.evaluations.find((r) => r.id === current.params.get('record'));
  return (
    <>
      <header>
        <div className="header-inner container">
          <a className="brand" href="#overview">
            <span className="brand-bars">
              <i />
              <i />
              <i />
            </span>
            CyberAI Analysis
          </a>
          <nav className={menu ? 'open' : ''} aria-label="主导航">
            {NAV.map(([v, label]) => (
              <a key={v} href={'#' + v} className={v === current.view ? 'active' : ''}>
                {label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <a className="github" href={REPO} target="_blank" rel="noreferrer">
              <Github size={15} />
              <span>GitHub</span>
            </a>
            {data && (
              <a
                className="icon-button"
                href={BASE + data.meta.downloadWorkbook}
                aria-label="下载完整数据"
              >
                <Download size={17} />
              </a>
            )}
            <button
              className="mobile-menu icon-button"
              aria-label="展开导航"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>
      {!data ? (
        <main className="container loading">{error || 'Loading model performance…'}</main>
      ) : (
        <main>
          {['overview', 'progress'].includes(current.view) ? (
            <>
              <Intro
                eyebrow="Language models / Cybersecurity"
                title={
                  <>
                    AI Cybersecurity
                    <br />
                    Benchmarks
                  </>
                }
                heading="大模型网络安全能力对比"
                meta={
                  <>
                    <span>{data.models.length} models</span>
                    <span>{data.benchmarks.length} benchmarks & tasks</span>
                    <span>{data.meta.scoreCount} reported results</span>
                  </>
                }
              >
                <p>
                  探索 OpenAI、Anthropic、Google、腾讯、智谱 GLM、DeepSeek 和 xAI
                  的模型在漏洞发现、漏洞利用、CTF 与多阶段任务中的表现。
                </p>
                <div className="intro-links">
                  <External url={REPO}>About this dataset</External>
                  <a href={BASE + 'downloads/results.csv'}>
                    Download data <Download size={14} />
                  </a>
                </div>
              </Intro>
              <Dashboard data={data} view={current.view} params={current.params} update={update} />
            </>
          ) : current.view === 'models' ? (
            <Models data={data} params={current.params} update={update} />
          ) : (
            <Benchmarks data={data} params={current.params} update={update} />
          )}
        </main>
      )}
      <footer className="container">
        <div>
          <a className="footer-brand" href="#overview">
            CyberAI Analysis
          </a>
          <span>AI capabilities, in focus.</span>
        </div>
        <div>
          <span>Updated {data?.meta.scoreReviewDate || '2026-10-18'}</span>
          <External url={REPO}>Data & code</External>
          {data && (
            <a href={BASE + data.meta.downloadWorkbook}>
              Download Excel <Download size={13} />
            </a>
          )}
        </div>
      </footer>
      {data && record && (
        <ResultDialog data={data} record={record} close={() => update({ record: '' })} />
      )}
    </>
  );
}
function Dashboard({
  data,
  view,
  params,
  update,
}: {
  data: Audit;
  view: string;
  params: URLSearchParams;
  update: (v: Record<string, string>) => void;
}) {
  const benchmark = params.get('benchmark') || 'ExploitBench';
  const all = useMemo(() => resultsFor(data, benchmark), [data, benchmark]);
  const creator = params.get('creator') || 'all',
    setting = params.get('setting') || 'all',
    search = params.get('search') || '';
  const families = familiesFor(
    all.filter((r) => creator === 'all' || r.model.provider === creator),
  );
  const family = families.find((f) => f.id === params.get('metric')) || families[0];
  const sort = params.get('sort') || 'score',
    asc = params.get('direction') === 'asc';
  const results = all
    .filter(
      (r) =>
        r.family.id === family?.id &&
        (creator === 'all' || r.model.provider === creator) &&
        (setting === 'all' || r.variant === setting) &&
        modelName(r.model).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      let v =
        sort === 'name'
          ? modelName(a.model).localeCompare(modelName(b.model))
          : sort === 'date'
            ? b.model.date.localeCompare(a.model.date)
            : (b.value ?? -Infinity) - (a.value ?? -Infinity);
      if (sort === 'score' && family?.lower) v = -v;
      return (asc ? -v : v) || a.key.localeCompare(b.key);
    });
  const quick = [
    'ExploitBench',
    'CyberGym',
    'SEC-Bench Pro',
    'CVE-Bench',
    'CyScenarioBench',
    'CTF Professional',
  ];
  const open = (r: Result) => update({ record: r.record.id });
  const choose = (name: string) => update({ benchmark: name, metric: '', setting: '', record: '' });
  const benchmarkInfo = data.benchmarks.find((b) => b.name === benchmark);
  const sortBy = (name: string) =>
    update({ sort: name, direction: sort === name && !asc ? 'asc' : '' });
  return (
    <section className="workspace container">
      <div className="workspace-top">
        <div className="view-tabs">
          <a
            className={view === 'overview' ? 'selected' : ''}
            href={href('overview', Object.fromEntries(params))}
          >
            Model comparison
          </a>
          <a
            className={view === 'progress' ? 'selected' : ''}
            href={href('progress', Object.fromEntries(params))}
          >
            Over time
          </a>
        </div>
        <a className="text-download" href={BASE + data.meta.downloadWorkbook}>
          <Download size={14} />
          Download
        </a>
      </div>
      <div className="benchmark-tabs">
        {quick.map((name) => (
          <button key={name} aria-pressed={name === benchmark} onClick={() => choose(name)}>
            {name}
          </button>
        ))}
        <select
          aria-label="选择评测"
          value={quick.includes(benchmark) ? '' : benchmark}
          onChange={(e) => choose(e.target.value)}
        >
          <option value="" disabled>
            More benchmarks
          </option>
          {data.benchmarks
            .filter((b) => !quick.includes(b.name))
            .map((b) => (
              <option key={b.name}>{b.name}</option>
            ))}
        </select>
      </div>
      <div className="chart-card">
        <div className="chart-heading">
          <div>
            <div className="benchmark-label">{benchmark}</div>
            <h2>{family?.label || 'Model performance'}</h2>
            <p>{benchmarkInfo?.task || '模型在所选评测中的表现'}</p>
          </div>
          <div className="chart-options">
            <select
              aria-label="选择指标"
              value={family?.id || ''}
              onChange={(e) => update({ metric: e.target.value, setting: '' })}
            >
              {families.length ? (
                families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))
              ) : (
                <option value="">No reported metrics</option>
              )}
            </select>
            <div className="legend">
              {CREATORS.map((c) => (
                <span key={c}>
                  <i style={{ background: COLORS[c] }} />
                  {CREATOR_LABELS[c]}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="filter-toolbar">
          <SearchBox value={search} onChange={(s) => update({ search: s })} />
          <select
            aria-label="筛选厂商"
            value={creator}
            onChange={(e) => update({ creator: e.target.value })}
          >
            <option value="all">All creators</option>
            {CREATORS.map((c) => (
              <option key={c} value={c}>
                {CREATOR_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            aria-label="筛选运行配置"
            value={setting}
            onChange={(e) => update({ setting: e.target.value })}
          >
            <option value="all">All configurations</option>
            {[...new Set(all.filter((r) => r.family.id === family?.id).map((r) => r.variant))].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
          <span className="result-count">
            {new Set(results.map((r) => r.model.id)).size} models · {results.length} results
          </span>
          {(search || creator !== 'all' || setting !== 'all') && (
            <button
              className="reset"
              onClick={() => update({ search: '', creator: '', setting: '' })}
            >
              Reset
            </button>
          )}
        </div>
        {family ? (
          <PerformanceChart
            results={results}
            family={family}
            time={view === 'progress'}
            open={open}
          />
        ) : (
          <div className="empty">该评测暂无公开数值成绩。</div>
        )}
        <div className="chart-foot">
          <span>
            {family?.unit === 'percent'
              ? 'Percentage (%)'
              : family?.unit === 'ratio'
                ? 'Ratio'
                : family?.unit || 'Reported value'}
            {family?.lower ? ' · Lower is better' : ' · Higher is better'}
          </span>
          <span>各条目保留报告中的运行设置，点击查看成绩与配置。</span>
        </div>
      </div>
      <div className="section-heading">
        <h2>{benchmark} — Model results</h2>
        <a href={BASE + 'downloads/results.csv'}>
          Export CSV <Download size={13} />
        </a>
      </div>
      <div className="table-scroll">
        <table aria-label="模型成绩表">
          <thead>
            <tr>
              <th>#</th>
              <th>
                <button onClick={() => sortBy('name')}>
                  Model {sort === 'name' && <ArrowDown size={12} />}
                </button>
              </th>
              <th>Creator</th>
              <th className="score-cell">
                <button onClick={() => sortBy('score')}>
                  {family?.label || 'Result'} {sort === 'score' && <ArrowDown size={12} />}
                </button>
              </th>
              <th>Configuration</th>
              <th>
                <button onClick={() => sortBy('date')}>
                  Release date {sort === 'date' && <ArrowDown size={12} />}
                </button>
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.key}>
                <td className="rank">{i + 1}</td>
                <td>
                  <button className="model-link" onClick={() => open(r)}>
                    <i style={{ background: COLORS[r.model.provider] }} />
                    {modelName(r.model)}
                  </button>
                </td>
                <td>
                  <Creator name={r.model.provider} />
                </td>
                <td className="score-cell">
                  <button className="score-value" onClick={() => open(r)}>
                    {r.display}
                  </button>
                </td>
                <td className="config-cell">
                  <span>{r.variant}</span>
                  <small title={configuration(r.metric.configuration)}>
                    {configuration(r.metric.configuration)}
                  </small>
                </td>
                <td className="date-cell">{r.model.date}</td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`查看${modelName(r.model)}的${r.family.label}结果`}
                    onClick={() => open(r)}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && <div className="empty">没有匹配结果，请调整指标或筛选条件。</div>}
      </div>
    </section>
  );
}
function PerformanceChart({
  results,
  family,
  time,
  open,
}: {
  results: Result[];
  family: Family;
  time: boolean;
  open: (r: Result) => void;
}) {
  const [hover, setHover] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
    setHover(undefined);
  }, [family.id, time]);
  const numeric = results.filter((r) => r.value !== null);
  const monthly = time ? numeric.filter((r) => r.model.date_precision === 'month') : [];
  const drawable = time ? numeric.filter((r) => r.model.date_precision === 'day') : numeric;
  const shown = expanded || time ? drawable : drawable.slice(0, 18);
  const width = time ? 1100 : Math.max(1000, shown.length * 66 + 110),
    height = time ? 360 : 440,
    top = 32,
    bottom = time ? 298 : 278,
    left = 58,
    right = 28;
  const max =
    family.unit === 'percent'
      ? Math.max(100, ...shown.map((r) => r.value!))
      : Math.max(1, ...shown.map((r) => r.value!)) * 1.12;
  const dates = shown.map((r) => Date.parse(r.model.date));
  const minDate = dates.length ? Math.min(...dates) - 86400000 * 10 : 0,
    maxDate = dates.length ? Math.max(...dates) + 86400000 * 10 : 1;
  const y = (n: number) => bottom - (n / max) * (bottom - top);
  const focused = shown.find((r) => r.key === hover);
  const step = (width - left - right) / Math.max(1, shown.length);
  return (
    <>
      <div className="plot-scroll">
        {shown.length ? (
          <svg
            className={'plot ' + (time ? 'time-plot' : 'bar-plot')}
            viewBox={`0 0 ${width} ${height}`}
            style={{ minWidth: time ? 700 : Math.min(width, 1000) }}
            role="group"
            aria-label={time ? '模型成绩随发布时间的变化' : '模型成绩柱状图'}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y(max * t)}
                  y2={y(max * t)}
                  className="grid-line"
                />
                <text x={left - 12} y={y(max * t) + 4} textAnchor="end" className="axis-label">
                  {numberText(max * t)}
                </text>
              </g>
            ))}
            {time &&
              [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
                <text
                  className="axis-label"
                  key={t}
                  x={left + t * (width - left - right)}
                  y={bottom + 27}
                  textAnchor="middle"
                >
                  {new Date(minDate + t * (maxDate - minDate)).toISOString().slice(0, 7)}
                </text>
              ))}
            {shown.map((r, i) => {
              const x = time
                ? left +
                  ((Date.parse(r.model.date) - minDate) / (maxDate - minDate)) *
                    (width - left - right)
                : left + step * (i + 0.5);
              const barWidth = Math.min(42, step * 0.62);
              return (
                <g
                  className="data-point"
                  role="button"
                  tabIndex={0}
                  key={r.key}
                  aria-label={`${modelName(r.model)}，${r.display}，${r.variant}，查看结果`}
                  onMouseEnter={() => setHover(r.key)}
                  onMouseLeave={() => setHover(undefined)}
                  onFocus={() => setHover(r.key)}
                  onBlur={() => setHover(undefined)}
                  onClick={() => open(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      open(r);
                    }
                  }}
                >
                  {time ? (
                    <circle
                      cx={x}
                      cy={y(r.value!)}
                      r={hover === r.key ? 8 : 6}
                      fill={COLORS[r.model.provider]}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  ) : (
                    <>
                      <rect
                        x={x - barWidth / 2}
                        y={y(r.value!)}
                        width={barWidth}
                        height={Math.max(2, bottom - y(r.value!))}
                        rx="1"
                        fill={COLORS[r.model.provider]}
                        opacity={focused && hover !== r.key ? 0.78 : 1}
                      />
                      <text x={x} y={y(r.value!) - 9} textAnchor="middle" className="bar-value">
                        {r.display}
                      </text>
                      <g transform={`translate(${x + 4},${bottom + 20}) rotate(-48)`}>
                        <text textAnchor="end" className="model-axis">
                          {modelName(r.model)}
                        </text>
                        <text textAnchor="end" y="15" className="config-axis">
                          {r.variant}
                        </text>
                      </g>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="empty">当前筛选下暂无可绘制的数值，请调整指标或筛选条件。</div>
        )}
      </div>
      <div className="chart-readout">
        {focused ? (
          <>
            <Creator name={focused.model.provider} />
            <strong>{modelName(focused.model)}</strong>
            <b>{focused.display}</b>
            <span>{focused.variant}</span>
            <button onClick={() => open(focused)}>
              View result <ArrowUpRight size={13} />
            </button>
          </>
        ) : (
          <span>悬停查看模型 · 点击查看完整成绩</span>
        )}
        {!time && drawable.length > 18 && (
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show fewer' : 'Show all ' + drawable.length + ' results'}
          </button>
        )}
      </div>
      {monthly.length > 0 && (
        <div className="month-results">
          <span>Month-level release dates</span>
          {monthly.map((r) => (
            <button key={r.key} onClick={() => open(r)}>
              <i style={{ background: COLORS[r.model.provider] }} />
              {modelName(r.model)} <b>{r.display}</b>
              <small>{r.model.date}</small>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
function Models({
  data,
  params,
  update,
}: {
  data: Audit;
  params: URLSearchParams;
  update: (p: Record<string, string>) => void;
}) {
  const selected = data.models.find((m) => m.id === params.get('model'));
  const search = params.get('search') || '',
    creator = params.get('creator') || 'all';
  if (selected) {
    const records = data.evaluations.filter(
      (r) => r.modelId === selected.id && r.status === '已确认',
    );
    return (
      <>
        <Intro
          eyebrow="Language models / Model profile"
          title={modelName(selected)}
          heading={selected.role}
          meta={
            <>
              <Creator name={selected.provider} />
              <span>Released {selected.date}</span>
              <span>
                {records.filter((r) => r.scoreStatus === 'reported').length} reported results
              </span>
            </>
          }
        >
          <p>查看该模型在公开网络安全评测中的成绩、任务覆盖与运行配置。</p>
          {selected.dateNote && <p>{selected.dateNote}</p>}
          <div className="intro-links">
            <a href="#models">← All models</a>
            <External url={selected.sourceUrl}>Model report</External>
          </div>
        </Intro>
        <section className="container workspace">
          <div className="section-heading">
            <h2>Cybersecurity performance</h2>
          </div>
          {records.length === 0 && (
            <p className="model-disclosure" role="status">
              暂无可归属到该版本的已确认成绩。{selected.caveats || selected.conclusion}
            </p>
          )}
          <div className="table-scroll">
            <table aria-label="模型评测成绩">
              <thead>
                <tr>
                  <th>Benchmark</th>
                  <th>Result</th>
                  <th>Category</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <a className="model-link" href={href('overview', { benchmark: r.benchmark })}>
                        {r.benchmark}
                      </a>
                    </td>
                    <td className="summary-cell">{scoreSummary(r)}</td>
                    <td>
                      {r.category === '能力'
                        ? 'Capability'
                        : r.category === '行为/拒答'
                          ? 'Behavior'
                          : 'Safeguards'}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={'查看' + r.benchmark + '结果'}
                        onClick={() => update({ record: r.id })}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }
  const models = data.models
    .filter(
      (m) =>
        (creator === 'all' || m.provider === creator) &&
        modelName(m).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Intro
        eyebrow="Language models / Model directory"
        title="AI Models"
        heading="按模型浏览网络安全表现"
        meta={
          <>
            <span>{data.models.length} models</span>
            <span>{new Set(data.models.map((m) => m.provider)).size} creators</span>
            <span>2026 releases</span>
          </>
        }
      >
        <p>从旗舰推理模型到高效轻量模型，查看各个版本的任务表现与发布信息。</p>
        <div className="intro-links">
          <External url={REPO}>Explore the dataset</External>
        </div>
      </Intro>
      <section className="container workspace">
        <div className="directory-toolbar">
          <SearchBox value={search} onChange={(search) => update({ search })} />
          <select
            aria-label="筛选模型厂商"
            value={creator}
            onChange={(e) => update({ creator: e.target.value })}
          >
            <option value="all">All creators</option>
            {CREATORS.map((c) => (
              <option key={c} value={c}>
                {CREATOR_LABELS[c]}
              </option>
            ))}
          </select>
          <span>{models.length} models</span>
        </div>
        <div className="table-scroll">
          <table aria-label="模型列表">
            <thead>
              <tr>
                <th>Model</th>
                <th>Creator</th>
                <th>Release date</th>
                <th>Focus</th>
                <th>Results</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a className="model-link" href={href('models', { model: m.id })}>
                      <i style={{ background: COLORS[m.provider] }} />
                      {modelName(m)}
                    </a>
                  </td>
                  <td>
                    <Creator name={m.provider} />
                  </td>
                  <td className="date-cell">{m.date}</td>
                  <td className="role-cell">{m.role}</td>
                  <td>
                    {
                      data.evaluations.filter(
                        (r) =>
                          r.modelId === m.id &&
                          r.scoreStatus === 'reported' &&
                          r.status === '已确认',
                      ).length
                    }
                  </td>
                  <td>
                    <a aria-label={'查看' + modelName(m)} href={href('models', { model: m.id })}>
                      <ChevronRight size={16} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function Benchmarks({
  data,
  params,
  update,
}: {
  data: Audit;
  params: URLSearchParams;
  update: (p: Record<string, string>) => void;
}) {
  const search = params.get('search') || '';
  const benchmarks = data.benchmarks.filter((b) =>
    (b.name + ' ' + b.task).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <Intro
        eyebrow="Language models / Evaluations"
        title={
          <>
            Cybersecurity
            <br />
            Evaluations
          </>
        }
        heading="从任务理解模型能力"
        meta={
          <>
            <span>{data.benchmarks.length} benchmarks & tasks</span>
            <span>Capability · Safeguards · Behavior</span>
          </>
        }
      >
        <p>覆盖真实漏洞复现、端到端利用、CTF 与安全防护。选择评测，探索模型在具体任务中的表现。</p>
        <div className="intro-links">
          <External url={REPO}>Dataset documentation</External>
        </div>
      </Intro>
      <section className="container workspace">
        <div className="directory-toolbar">
          <SearchBox
            value={search}
            onChange={(search) => update({ search })}
            placeholder="Search evaluations…"
          />
          <span>{benchmarks.length} evaluations</span>
        </div>
        <div className="benchmark-directory">
          {benchmarks.map((b) => (
            <a
              className="benchmark-row"
              key={b.name}
              href={href('overview', { benchmark: b.name })}
            >
              <div className="benchmark-monogram">{b.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h2>{b.name}</h2>
                <p>{b.task}</p>
                <small>{b.openness.replaceAll('核验', '验证')}</small>
              </div>
              <span>
                {
                  new Set(
                    data.evaluations
                      .filter((r) => r.benchmark === b.name && r.scoreStatus === 'reported')
                      .map((r) => r.modelId),
                  ).size
                }{' '}
                models
              </span>
              <ArrowUpRight size={19} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
function ResultDialog({
  data,
  record,
  close,
}: {
  data: Audit;
  record: Evaluation;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const model = data.models.find((m) => m.id === record.modelId)!;
  useEffect(() => {
    const focus = document.activeElement as HTMLElement;
    const previous = document.body.style.overflow;
    ref.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      focus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="result-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-labelledby="result-title"
    >
      <div className="dialog-inner">
        <div className="dialog-top">
          <span>Model performance</span>
          <button className="icon-button" aria-label="关闭结果详情" onClick={close}>
            <X size={20} />
          </button>
        </div>
        <Creator name={model.provider} />
        <h2 id="result-title">{modelName(model)}</h2>
        <div className="dialog-subtitle">
          <span className="benchmark-label">{record.benchmark}</span>
          <span>Released {model.date}</span>
        </div>
        <div className="reported-result">
          <span>Reported result</span>
          <strong>{scoreSummary(record)}</strong>
        </div>
        {record.metrics.length > 0 && (
          <section aria-label="分项成绩">
            <h3>Results & configurations</h3>
            {record.metrics.map((m, i) => (
              <div className="metric-row" key={i}>
                <div>
                  <b>{m.label}</b>
                  <p>{configuration(m.configuration)}</p>
                </div>
                <strong>
                  {typeof m.value === 'number' ? numberText(m.value) : m.value}
                  {m.unit === 'percent' ? '%' : ''}
                </strong>
              </div>
            ))}
          </section>
        )}
        <section className="run-settings">
          <h3>运行设置</h3>
          <p>{configuration(record.configuration)}</p>
          {record.scoreAudit?.laterDisclosure && (
            <p>后续报告披露：此成绩来自模型发布后的报告或补测，不能视为首发成绩。</p>
          )}
          {record.scoreAudit?.notes && <p>{record.scoreAudit.notes}</p>}
          {record.scoreAudit?.evidence.map((evidence, index) => (
            <p key={index}>
              来源定位：{evidence.pages ? `PDF 文件第 ${evidence.pages} 页` : evidence.section} ·{' '}
              <External url={evidence.sourceUrl}>原始来源</External>
            </p>
          ))}
        </section>
        <div className="dialog-links">
          <External url={sourceLink(record)}>查看报告</External>
          <External url={model.sourceUrl}>Model 主页</External>
          <button
            onClick={() => {
              navigator.clipboard.writeText(location.href).then(() => setCopied(true));
            }}
          >
            <Copy size={13} />
            {copied ? '已复制' : '复制链接'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
