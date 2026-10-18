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
  familiesFor,
  orderedBenchmarks,
  modelName,
  numberText,
  resultsFor,
  sourceLink,
  type Family,
  type Result,
} from './results';
import { LanguageProvider, useLanguage } from './language';
import './style.css';
const BASE = import.meta.env.BASE_URL,
  REPO = 'https://github.com/Hongkun16/cyberai-observatory';
const NAV = [
  ['overview', '能力对比', 'Comparison'],
  ['progress', '进展趋势', 'Progress'],
  ['models', '模型', 'Models'],
  ['benchmarks', '评测', 'Evaluations'],
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
      <img
        className="creator-icon"
        src={BASE + 'logos/' + name.toLowerCase() + '.png'}
        alt=""
        width={20}
        height={20}
        decoding="async"
      />
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
  const { t } = useLanguage();
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
        <button aria-label={t('清除搜索', 'Clear search')} onClick={() => onChange('')}>
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
  const { language, setLanguage, t } = useLanguage();
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
    document.title =
      (NAV.find(([v]) => v === current.view)?.[language === 'en' ? 2 : 1] || '') +
      ' | CyberAI Analysis';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      'content',
      t(
        '对比大模型在网络安全评测中的表现，探索漏洞发现、漏洞利用、CTF与安全防护成绩。',
        'Compare AI models on cybersecurity evaluations: vulnerability discovery, exploitation, CTFs and safeguards.',
      ),
    );
    if (previous.current !== current.view) {
      window.scrollTo(0, 0);
      previous.current = current.view;
    }
  }, [current.view, language]);
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
          <nav className={menu ? 'open' : ''} aria-label={t('主导航', 'Main navigation')}>
            {NAV.map(([v, zh, en]) => (
              <a key={v} href={'#' + v} className={v === current.view ? 'active' : ''}>
                {t(zh, en)}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="language-toggle"
              type="button"
              aria-label={t('Switch to English', 'Switch to Chinese')}
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            >
              {language === 'zh' ? 'English' : '中文'}
            </button>
            <a className="github" href={REPO} target="_blank" rel="noreferrer">
              <Github size={15} />
              <span>GitHub</span>
            </a>
            {data && (
              <a
                className="icon-button"
                href={BASE + data.meta.downloadWorkbook}
                aria-label={t('下载完整数据', 'Download full dataset')}
              >
                <Download size={17} />
              </a>
            )}
            <button
              className="mobile-menu icon-button"
              aria-label={t('展开导航', 'Toggle navigation')}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>
      {!data ? (
        <main className="container loading">
          {error
            ? t('数据加载失败，请刷新重试。', 'Unable to load data. Please refresh and try again.')
            : 'Loading model performance…'}
        </main>
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
                heading={t('大模型网络安全能力对比', 'Compare AI cybersecurity capabilities')}
                meta={
                  <>
                    <span>{data.models.length} models</span>
                    <span>{data.benchmarks.length} benchmarks & tasks</span>
                    <span>{data.meta.scoreCount} reported results</span>
                  </>
                }
              >
                <p>
                  {t(
                    '探索 OpenAI、Anthropic、Google、Tencent、GLM、DeepSeek、xAI 和 Kimi 的模型在漏洞发现、漏洞利用、CTF 与多阶段任务中的表现。',
                    'Explore OpenAI, Anthropic, Google, Tencent, GLM, DeepSeek, xAI and Kimi models on vulnerability discovery, exploitation, CTFs and multi-stage tasks.',
                  )}
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
  const { t, tr, config } = useLanguage();
  const ordered = useMemo(() => orderedBenchmarks(data), [data]);
  const benchmark = params.get('benchmark') || ordered[0]?.name || 'ExploitBench';
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
  const quick = ordered.slice(0, 6).map((b) => b.name);
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
      <p className="ordering-note">
        {t(
          '按参考表使用次数排序；模型数为本站已披露数值成绩的去重统计。',
          'Ordered by usage in the reference workbook; model counts show unique models with reported numerical results on this site.',
        )}
      </p>
      <div className="benchmark-tabs">
        {quick.map((name) => (
          <button key={name} aria-pressed={name === benchmark} onClick={() => choose(name)}>
            {name}
          </button>
        ))}
        <select
          aria-label={t('选择评测', 'Choose evaluation')}
          value={quick.includes(benchmark) ? '' : benchmark}
          onChange={(e) => choose(e.target.value)}
        >
          <option value="" disabled>
            More benchmarks
          </option>
          {ordered
            .filter((b) => !quick.includes(b.name))
            .map((b) => (
              <option key={b.name} value={b.name}>
                {tr(b.name)}
              </option>
            ))}
        </select>
      </div>
      <div className="chart-card">
        <div className="chart-heading">
          <div>
            <div className="benchmark-label">{tr(benchmark)}</div>
            <h2>{tr(family?.label || 'Model performance')}</h2>
            <p>
              {benchmarkInfo
                ? tr(benchmarkInfo.task)
                : t('模型在所选评测中的表现', 'Model performance on the selected evaluation')}
            </p>
          </div>
          <div className="chart-options">
            <select
              aria-label={t('选择指标', 'Choose metric')}
              value={family?.id || ''}
              onChange={(e) => update({ metric: e.target.value, setting: '' })}
            >
              {families.length ? (
                families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {tr(f.label)}
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
                  <img
                    src={BASE + 'logos/' + c.toLowerCase() + '.png'}
                    alt=""
                    width={18}
                    height={18}
                  />
                  {CREATOR_LABELS[c]}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="filter-toolbar">
          <SearchBox value={search} onChange={(s) => update({ search: s })} />
          <select
            aria-label={t('筛选厂商', 'Filter creator')}
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
            aria-label={t('筛选运行配置', 'Filter configuration')}
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
          <div className="empty">
            {t(
              '该评测暂无公开数值成绩。',
              'No public numerical results are available for this evaluation.',
            )}
          </div>
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
          <span>
            {t(
              '各条目保留报告中的运行设置，点击查看成绩与配置。',
              'Each entry retains its reported settings. Select a result to inspect the score and configuration.',
            )}
          </span>
        </div>
      </div>
      <div className="section-heading">
        <h2>{tr(benchmark)} — Model results</h2>
        <a href={BASE + 'downloads/results.csv'}>
          Export CSV <Download size={13} />
        </a>
      </div>
      <div className="table-scroll">
        <table aria-label={t('模型成绩表', 'Model results')}>
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
                  {tr(family?.label || 'Result')} {sort === 'score' && <ArrowDown size={12} />}
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
                  <small title={config(r.metric.configuration)}>
                    {config(r.metric.configuration)}
                  </small>
                </td>
                <td className="date-cell">{r.model.date}</td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={t(
                      `查看${modelName(r.model)}的${r.family.label}结果`,
                      `View ${modelName(r.model)} — ${tr(r.family.label)} result`,
                    )}
                    onClick={() => open(r)}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && (
          <div className="empty">
            {t(
              '没有匹配结果，请调整指标或筛选条件。',
              'No matching results. Try another metric or filter.',
            )}
          </div>
        )}
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
  const { t, tr } = useLanguage();
  const [hover, setHover] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(1000);
  useEffect(() => {
    if (!plotRef.current) return;
    const observer = new ResizeObserver(([entry]) => setPlotWidth(entry.contentRect.width));
    observer.observe(plotRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setExpanded(false);
    setHover(undefined);
  }, [family.id, time]);
  const numeric = results.filter((r) => r.value !== null);
  const monthly = time ? numeric.filter((r) => r.model.date_precision === 'month') : [];
  const drawable = time ? numeric.filter((r) => r.model.date_precision === 'day') : numeric;
  const shown = expanded || time ? drawable : drawable.slice(0, 18);
  const width = time ? 1100 : Math.max(Math.min(plotWidth, 1000), shown.length * 66 + 110),
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
      <div className="plot-scroll" ref={plotRef}>
        {shown.length ? (
          <svg
            className={'plot ' + (time ? 'time-plot' : 'bar-plot')}
            viewBox={`0 0 ${width} ${height}`}
            style={{ minWidth: time ? 700 : Math.min(width, 1000) }}
            role="group"
            aria-label={
              time
                ? t('模型成绩随发布时间的变化', 'Model results over release dates')
                : t('模型成绩柱状图', 'Model results bar chart')
            }
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
                  aria-label={t(
                    `${modelName(r.model)}，${r.display}，${r.variant}，查看结果`,
                    `${modelName(r.model)}, ${r.display}, ${r.variant}, view result`,
                  )}
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
          <div className="empty">
            {t(
              '当前筛选下暂无可绘制的数值，请调整指标或筛选条件。',
              'No plottable values for these filters. Try another metric or configuration.',
            )}
          </div>
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
          <span>
            {t(
              '悬停查看模型 · 点击查看完整成绩',
              'Hover to inspect a model · Select to view full results',
            )}
          </span>
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
  const { language, t, tr, summary } = useLanguage();
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
          heading={tr(selected.role)}
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
          <p>
            {t(
              '查看该模型在公开网络安全评测中的成绩、任务覆盖与运行配置。',
              'Explore this model’s reported cybersecurity results, task coverage and evaluation settings.',
            )}
          </p>
          {selected.dateNote && <p>{tr(selected.dateNote)}</p>}
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
              {t(
                '暂无可归属到该版本的已确认成绩。',
                'No confirmed results attributable to this version. ',
              )}
              {language === 'zh'
                ? selected.caveats || selected.conclusion
                : ['grok-4-7-fast', 'kimi-k2-7-code-highspeed'].includes(selected.id)
                  ? 'This is a faster service tier of the same model, without separate scores.'
                  : 'Results from other snapshots or deployment configurations are not inherited.'}
            </p>
          )}
          <div className="table-scroll">
            <table aria-label={t('模型评测成绩', 'Model evaluation results')}>
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
                        {tr(r.benchmark)}
                      </a>
                    </td>
                    <td className="summary-cell">{summary(r)}</td>
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
                        aria-label={t(
                          '查看' + r.benchmark + '结果',
                          'View ' + tr(r.benchmark) + ' result',
                        )}
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
        heading={t('按模型浏览网络安全表现', 'Browse cybersecurity performance by model')}
        meta={
          <>
            <span>{data.models.length} models</span>
            <span>{new Set(data.models.map((m) => m.provider)).size} creators</span>
            <span>2026 releases</span>
          </>
        }
      >
        <p>
          {t(
            '从旗舰推理模型到高效轻量模型，查看各个版本的任务表现与发布信息。',
            'Explore performance and release information for flagship reasoning models and efficient lightweight models.',
          )}
        </p>
        <div className="intro-links">
          <External url={REPO}>Explore the dataset</External>
        </div>
      </Intro>
      <section className="container workspace">
        <div className="directory-toolbar">
          <SearchBox value={search} onChange={(search) => update({ search })} />
          <select
            aria-label={t('筛选模型厂商', 'Filter model creator')}
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
          <table aria-label={t('模型列表', 'Model directory')}>
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
                  <td className="role-cell">{tr(m.role)}</td>
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
                    <a
                      aria-label={t('查看' + modelName(m), 'View ' + modelName(m))}
                      href={href('models', { model: m.id })}
                    >
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
  const { t, tr } = useLanguage();
  const search = params.get('search') || '';
  const benchmarks = orderedBenchmarks(data).filter((b) =>
    (b.name + ' ' + b.task + ' ' + tr(b.name) + ' ' + tr(b.task))
      .toLowerCase()
      .includes(search.toLowerCase()),
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
        heading={t('从任务理解模型能力', 'Understand capabilities through tasks')}
        meta={
          <>
            <span>{data.benchmarks.length} benchmarks & tasks</span>
            <span>Capability · Safeguards · Behavior</span>
          </>
        }
      >
        <p>
          {t(
            '覆盖真实漏洞复现、端到端利用、CTF 与安全防护。选择评测，探索模型在具体任务中的表现。',
            'Explore real-world vulnerability reproduction, end-to-end exploitation, CTFs and safeguards. Choose an evaluation to inspect model performance.',
          )}
        </p>
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
        <p className="ordering-note">
          {t(
            '按 Benchmark_Summary.xlsx 的 Times 排序；未列项目按本站模型覆盖数排列。',
            'Ordered by Times in Benchmark_Summary.xlsx; unlisted evaluations follow in order of model coverage on this site.',
          )}
        </p>
        <div className="benchmark-directory">
          {benchmarks.map((b) => (
            <a
              className="benchmark-row"
              key={b.name}
              href={href('overview', { benchmark: b.name })}
            >
              <div className="benchmark-monogram">{tr(b.name).slice(0, 2).toUpperCase()}</div>
              <div>
                <h2>{tr(b.name)}</h2>
                <p>{tr(b.task)}</p>
                <small>{tr(b.openness).replaceAll('核验', '验证')}</small>
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
  const { language, t, tr, config, summary } = useLanguage();
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
          <button
            className="icon-button"
            aria-label={t('关闭结果详情', 'Close result details')}
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        <Creator name={model.provider} />
        <h2 id="result-title">{modelName(model)}</h2>
        <div className="dialog-subtitle">
          <span className="benchmark-label">{tr(record.benchmark)}</span>
          <span>Released {model.date}</span>
        </div>
        <div className="reported-result">
          <span>Reported result</span>
          <strong>{summary(record)}</strong>
        </div>
        {record.metrics.length > 0 && (
          <section aria-label={t('分项成绩', 'Detailed results')}>
            <h3>Results & configurations</h3>
            {record.metrics.map((m, i) => (
              <div className="metric-row" key={i}>
                <div>
                  <b>{tr(m.label)}</b>
                  <p>{config(m.configuration)}</p>
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
          <h3>{t('运行设置', 'Run settings')}</h3>
          {record.assessmentProvider && (
            <p>
              {t('评测方：', 'Assessed by: ')}
              {record.assessmentProvider}
              {' · '}
              {record.assessmentKind === 'independent'
                ? t('独立机构评测', 'Independent assessment')
                : record.assessmentKind === 'cross-vendor'
                  ? t('其他厂商评测', 'Cross-vendor assessment')
                  : t('厂商自测', 'Vendor self-report')}
            </p>
          )}
          <p>
            {language === 'en'
              ? record.metrics.length
                ? [...new Set(record.metrics.map((metric) => config(metric.configuration)))].join(
                    '; ',
                  )
                : 'See the original report and transcription for full evaluation settings.'
              : config(record.configuration)}
          </p>
          {record.scoreAudit?.laterDisclosure && (
            <p>
              {t(
                '后续报告披露：此成绩来自模型发布后的报告或补测，不能视为首发成绩。',
                'Later disclosure: this result comes from a subsequent report or evaluation and is not a launch-time score.',
              )}
            </p>
          )}
          {language === 'zh' && record.scoreAudit?.notes && <p>{record.scoreAudit.notes}</p>}
          {record.scoreAudit?.evidence.map((evidence, index) => (
            <p key={index}>
              {t('来源定位：', 'Source location: ')}
              {evidence.pages
                ? t(`PDF 文件第 ${evidence.pages} 页`, `PDF file page ${evidence.pages}`)
                : language === 'en' && /[\u3400-\u9fff]/.test(evidence.section || '')
                  ? 'Report table or figure; original locator below'
                  : evidence.section}{' '}
              · <External url={evidence.sourceUrl}>{t('原始来源', 'Original source')}</External>
            </p>
          ))}
        </section>
        {language === 'en' && (
          <details className="original-transcription">
            <summary>Original transcription & qualifications</summary>
            <div lang="zh-CN">
              <p>{record.score}</p>
              <p>{record.configuration}</p>
              <p>{record.scoreAudit?.notes}</p>
              {record.scoreAudit?.evidence.map((e, i) => (
                <p key={i}>
                  {e.section} {e.quote}
                </p>
              ))}
            </div>
          </details>
        )}
        <div className="dialog-links">
          <External url={sourceLink(record)}>{t('查看报告', 'View report')}</External>
          <External url={model.sourceUrl}>{t('Model 主页', 'Model homepage')}</External>
          <button
            onClick={() => {
              navigator.clipboard.writeText(location.href).then(() => setCopied(true));
            }}
          >
            <Copy size={13} />
            {copied ? t('已复制', 'Copied') : t('复制链接', 'Copy link')}
          </button>
        </div>
      </div>
    </dialog>
  );
}
createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);
