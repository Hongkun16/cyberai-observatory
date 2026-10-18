import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const origin = process.env.TEST_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await mkdir('test-results', { recursive: true });
try {
  await page.goto(origin);
  await page.getByRole('heading', { name: '追踪大模型 网络安全能力的演进。' }).waitFor();
  await expect(page.locator('.stat strong').first()).toHaveText('48↗');
  assert.ok((await page.locator('.data-point').count()) > 0);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });

  // SVG marks must be operable by keyboard and restore focus on close.
  const dot = page.locator('.data-point').first();
  await dot.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  assert.match(await page.locator('.record-id').innerText(), /^CAO-2026-/);
  assert.ok(await page.getByRole('link', { name: '打开官方来源' }).getAttribute('href'));
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assert.equal(await dot.evaluate((n) => document.activeElement === n), true);

  // A deep-linked evidence record works on a fresh load.
  await page.goto(origin + '#evidence?record=CAO-2026-0002');
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.locator('.reported-score strong').innerText(), '90%');
  await page.getByRole('button', { name: '关闭证据面板' }).click();
  await expect(page.locator('.record-table tbody tr')).toHaveCount(233);
  await page.getByRole('combobox', { name: '筛选证据状态' }).selectOption('模型覆盖待核对');
  await expect(page.locator('.record-table tbody tr')).toHaveCount(15);
  await page.getByRole('combobox', { name: '筛选记录类别' }).selectOption('行为/拒答');
  await page.getByRole('heading', { name: '没有找到匹配结果' }).waitFor();

  await page.goto(origin + '#progress?benchmark=ExploitBench');
  await page.getByRole('heading', { name: '把成绩放回时间与条件中。' }).waitFor();
  assert.equal(await page.locator('.month-records button').count(), 2);
  assert.equal(await page.locator('.data-point').count(), 3);
  await page.getByRole('button', { name: 'Anthropic', exact: true }).click();
  await page.getByText('当前筛选下，没有日精度、单一百分数的能力成绩').waitFor();

  await page.goto(origin + '#models?search=Gemini');
  await page.getByRole('heading', { name: '每一个模型，都有自己的证据档案。' }).waitFor();
  await expect(page.locator('.model-card')).toHaveCount(11);
  await page.getByRole('button', { name: '矩阵', exact: true }).click();
  await expect(page.locator('.matrix tbody tr')).toHaveCount(11);
  await page.locator('.matrix tbody th a').first().click();
  await page.getByRole('heading', { name: '评测与证据', exact: true }).waitFor();
  await page.goto(origin + '#benchmarks?search=CVE-Bench');
  await page.locator('.benchmark-card').click();
  await page.getByRole('heading', { name: 'CVE-Bench', exact: true }).waitFor();

  for (const path of [
    'data/audit.json',
    'downloads/results.csv',
    'downloads/audit-2026-10-17.xlsx',
  ]) {
    const result = await page.request.get(origin + path);
    assert.equal(result.status(), 200);
  }
  await page.goto(origin + '#evidence?section=method');
  await page.getByRole('heading', { name: '一份公开报告的证据地图。' }).waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '#overview');
  await page.getByRole('heading', { name: '追踪大模型 网络安全能力的演进。' }).waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    'Mobile page overflows horizontally',
  );
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  await page.getByRole('button', { name: '展开导航' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Models 模型库' }).click();
  await page.getByRole('heading', { name: '每一个模型，都有自己的证据档案。' }).waitFor();
  await expect(page.locator('.model-card')).toHaveCount(48);
  await page.goto(origin + '#evidence?record=CAO-2026-0147');
  await page.getByRole('dialog').waitFor();
  assert.match(await page.locator('.reported-score strong').innerText(), /289\/869/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: 'test-results/evidence-mobile.png', fullPage: true });
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log(
    'Browser checks passed: desktop, mobile, chart keyboard, deep links, filters, model matrix, benchmark detail, downloads and evidence.',
  );
} finally {
  await browser.close();
}
