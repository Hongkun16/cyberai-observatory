export type Provider = 'OpenAI' | 'Anthropic' | 'Google';
export type Model = {
  id: string; name: string; provider: Provider; date: string; date_precision: 'day' | 'month';
  role: string; dateEvidence: string; dateNote: string; dateSource: string;
  sourceUrl: string; reportType: string; pdfKind: string; pdfPath: string; pdfPages: number;
  sha256: string; conclusion: string; caveats: string;
};
export type Evaluation = {
  id: string; modelId: string; benchmark: string; status: string; category: string;
  score: string; numericScore: number | null; configuration: string; section: string;
  pages: string; sourceKind: string; sourceUrl: string; pdfUrl: string; pdfPath: string;
  note: string; comparisonGroup: string | null;
};
export type Benchmark = { name: string; openness: string; task: string; caveat: string; sourceUrl: string };
export type Audit = {
  meta: { asOf: string; modelCount: number; recordCount: number; scoreCount: number; numericCount: number; scope: string; workbookSha256: string };
  models: Model[]; evaluations: Evaluation[]; benchmarks: Benchmark[];
  revisions: { subject: string; before: string; change: string; sourceUrl: string; pages: string }[];
  pdfs: { name: string; purpose: string; kind: string; path: string; pages: number; sha256: string; sourceUrl: string; downloadUrl: string; fetchedAt: string }[];
  sources: { url: string; status: string; finalUrl: string; contentType: string; sha256: string; fetchedAt: string; error: string }[];
};
