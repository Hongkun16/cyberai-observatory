import type { Audit, Evaluation, Model, Provider } from './types';

export const CREATORS: Provider[] = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Tencent',
  'Zhipu',
  'DeepSeek',
  'xAI',
  'Kimi',
];
export const COLORS: Record<Provider, string> = {
  OpenAI: '#278768',
  Anthropic: '#d27b62',
  Google: '#4f85cc',
  Tencent: '#8566b5',
  Zhipu: '#bd8a28',
  DeepSeek: '#4659bd',
  xAI: '#525660',
  Kimi: '#c75a86',
};
export const CREATOR_LABELS: Record<Provider, string> = {
  OpenAI: 'OpenAI',
  Anthropic: 'Anthropic',
  Google: 'Google',
  Tencent: 'Tencent',
  Zhipu: 'GLM',
  DeepSeek: 'DeepSeek',
  xAI: 'xAI',
  Kimi: 'Kimi',
};
export type Metric = Evaluation['metrics'][number];
export type Family = { id: string; label: string; unit: string; lower: boolean };
export type Result = {
  key: string;
  record: Evaluation;
  model: Model;
  metric: Metric;
  family: Family;
  value: number | null;
  display: string;
  variant: string;
};

export function modelName(model: Model) {
  return model.name
    .replace('GPT-5.4 / GPT-5.4 Thinking', 'GPT-5.4 Thinking')
    .replace('GPT-5.5 / GPT-5.5 Thinking', 'GPT-5.5 Thinking')
    .replace('（10月更新）', ' · Oct')
    .replace('（9月）', ' · Sep')
    .replace('（2月更新）', ' · Feb');
}
export function configuration(text: string) {
  const cleaned = text
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s &&
        !/原表|后续|后测|待核|已确认|专属分数|与9月分开|历史污染|不混|不能当作|宣发披露|正文明确/.test(
          s,
        ),
    )
    .join('；')
    .replaceAll('核验', '验证')
    .replaceAll('原卡', '报告')
    .replaceAll('原始卡', '报告');
  return cleaned || '见报告中的运行设置';
}
export function variant(text: string) {
  if (/plain\s*\+\s*AutoNudge/i.test(text)) return 'Combined';
  if (/T3|防护开启|开启防护/.test(text)) return 'Safeguards on';
  if (/autonudge/i.test(text)) return 'AutoNudge';
  if (/\bplain\b/i.test(text)) return 'Plain';
  if (/Antigravity/i.test(text)) return 'Antigravity';
  if (/6h|6小时|six.hour/i.test(text)) return '6 hours';
  if (/2h|2小时|two.hour/i.test(text)) return '2 hours';
  if (/防护关闭|关闭防护|without safeguards/.test(text)) return 'Safeguards off';
  return 'Report setting';
}
function familyFor(benchmark: string, metric: Metric): Family {
  const name = metric.label;
  let unit = metric.unit,
    id = name,
    label = name;
  if (benchmark === 'ExploitBench' && /^(Cap Percent|Cap%|能力达成率)$/i.test(name)) {
    id = 'cap-percent';
    label = 'Cap%';
    unit = 'percent';
  } else if (/平均能力flags/.test(name)) {
    id = 'mean-flags';
    label = 'Mean capability flags';
  } else if (/平均成功率|平均solve rate/i.test(name)) {
    id = 'average-success';
    label = 'Average success rate';
  } else if (benchmark === 'CyberGym' && /目标漏洞复现|^CyberGym$/.test(name)) {
    id = 'target-pass-1';
    label = 'Target vulnerability · pass@1';
    unit = 'percent';
  } else if (/平均 pass@1|平均pass@1/i.test(name)) {
    id = 'average-pass-1';
    label = 'Average pass@1';
    unit = 'percent';
  } else if (name === '完整ACE') {
    id = 'full-ace';
    label = 'Full arbitrary code execution';
  } else if (name === '完整ACE率') {
    id = 'full-ace-rate';
    label = 'Full ACE rate';
  }
  return {
    id: id + '|' + unit,
    label,
    unit,
    lower: /违规率|良性拒答|ASR|QSR|OSR|攻击成功率|风险双用途提示放行率/.test(name),
  };
}
export function numberText(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}
export function resultText(result: Result) {
  if (result.family.unit === 'percent')
    return typeof result.metric.value === 'number'
      ? `${numberText(result.value!)}%`
      : `${result.metric.value}%`;
  return typeof result.metric.value === 'number'
    ? numberText(result.metric.value)
    : result.metric.value;
}
export function resultsFor(data: Audit, benchmark: string): Result[] {
  const models = new Map(data.models.map((model) => [model.id, model]));
  return data.evaluations
    .filter(
      (record) =>
        record.benchmark === benchmark &&
        record.scoreStatus === 'reported' &&
        record.status === '已确认',
    )
    .flatMap((record) =>
      record.metrics.map((metric, index) => {
        const family = familyFor(benchmark, metric);
        let value: number | null = typeof metric.value === 'number' ? metric.value : null;
        if (family.unit === 'percent' && metric.unit === 'ratio' && value !== null) value *= 100;
        if (
          typeof metric.value === 'string' &&
          metric.unit === 'ratio' &&
          /^\d+\/\d+$/.test(metric.value)
        ) {
          const [n, d] = metric.value.split('/').map(Number);
          if (d > 0) value = n / d;
        }
        const result: Result = {
          key: `${record.id}-${index}`,
          record,
          model: models.get(record.modelId)!,
          metric,
          family,
          value,
          display: '',
          variant: variant(metric.configuration),
        };
        result.display = resultText(result);
        return result;
      }),
    );
}
export function familiesFor(results: Result[]) {
  const families = [
    ...new Map(results.map((result) => [result.family.id, result.family])).values(),
  ];
  const order = [
    'cap-percent|percent',
    'target-pass-1|percent',
    'pass@1|percent',
    'pass@12|percent',
    'average-success|percent',
    'average-pass-1|percent',
  ];
  return families.sort((a, b) => {
    const ai = order.indexOf(a.id),
      bi = order.indexOf(b.id);
    return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
  });
}
export function sourceLink(record: Evaluation) {
  const evidence = record.scoreAudit?.evidence[0];
  const url = evidence?.sourceUrl || record.pdfUrl || record.sourceUrl;
  const page = evidence?.pages.match(/\d+/)?.[0];
  return page && new URL(url).pathname.toLowerCase().endsWith('.pdf')
    ? url.split('#')[0] + '#page=' + page
    : url;
}
export function scoreSummary(record: Evaluation) {
  if (record.scoreStatus === 'reported') return record.score;
  if (record.scoreStatus === 'graphical') return '结果见报告图表';
  if (record.scoreStatus === 'qualitative' && record.score) return record.score;
  return '—';
}

export function orderedBenchmarks(data: Audit) {
  const reference = new Map(
    data.benchmarkUsage.entries.map((entry, index) => [entry.name, { ...entry, index }]),
  );
  const coverage = new Map<string, Set<string>>();
  for (const record of data.evaluations) {
    if (record.status !== '已确认' || record.scoreStatus !== 'reported') continue;
    if (!coverage.has(record.benchmark)) coverage.set(record.benchmark, new Set());
    coverage.get(record.benchmark)!.add(record.modelId);
  }
  return [...data.benchmarks].sort((a, b) => {
    const ar = reference.get(a.name),
      br = reference.get(b.name);
    if (ar && br) return br.times - ar.times || ar.index - br.index;
    if (ar || br) return ar ? -1 : 1;
    return (
      (coverage.get(b.name)?.size || 0) - (coverage.get(a.name)?.size || 0) ||
      a.name.localeCompare(b.name, 'en')
    );
  });
}
