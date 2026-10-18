import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const origin = process.env.TEST_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  reducedMotion: 'reduce',
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('test-results', { recursive: true });
try {
  await page.goto(origin);
  await page.getByRole('heading', { name: 'AI Cybersecurity Benchmarks' }).waitFor();
  await expect(page.getByRole('table', { name: '模型成绩表' }).locator('tbody tr')).not.toHaveCount(
    0,
  );
  assert.ok((await page.locator('.data-point').count()) > 0);
  assert.deepEqual(await page.locator('.benchmark-tabs > button').allTextContents(), [
    'ExploitBench',
    'CyberGym',
    'ExploitGym',
    'SEC-Bench Pro',
    'CyScenarioBench',
    'CVE-Bench',
  ]);
  await expect(page.locator('.legend img')).toHaveCount(7);
  await expect
    .poll(() =>
      page
        .locator('.legend img')
        .evaluateAll((images) =>
          images.every(
            (img) => img.complete && img.naturalWidth === 128 && img.naturalHeight === 128,
          ),
        ),
    )
    .toBe(true);
  assert.doesNotMatch(await page.locator('body').innerText(), /审计|证据与方法|核验修订/);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  const mark = page.locator('.data-point').first();
  await mark.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  await expect(page.getByRole('region', { name: '分项成绩' })).toBeVisible();
  assert.ok(await page.getByRole('link', { name: '查看报告', exact: true }).getAttribute('href'));
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assert.ok(await mark.evaluate((n) => n === document.activeElement));
  await page.getByRole('combobox', { name: '筛选厂商', exact: true }).selectOption('Anthropic');
  await expect(page.locator('table tbody tr')).not.toHaveCount(0);
  assert.ok((await page.locator('table tbody').innerText()).includes('Claude'));
  assert.ok(!(await page.locator('table tbody').innerText()).includes('GPT'));
  await page.getByRole('combobox', { name: '筛选运行配置' }).selectOption('AutoNudge');
  assert.ok((await page.locator('table tbody').innerText()).includes('AutoNudge'));
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('combobox', { name: '筛选厂商', exact: true })).toHaveValue('all');
  await page.getByRole('button', { name: 'CyberGym', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Target vulnerability · pass@1', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('73%');
  await page.goto(origin + '#progress?benchmark=ExploitBench');
  await page.locator('.time-plot').waitFor();
  await expect(page.locator('.month-results button')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/progress.png', fullPage: true });
  await page.goto(origin + '#models?search=Gemini');
  await page.getByRole('heading', { name: 'AI Models', exact: true }).waitFor();
  await expect(page.locator('table tbody tr')).toHaveCount(11);
  await page.locator('table tbody .model-link').first().click();
  await page.getByRole('heading', { name: 'Cybersecurity performance', exact: true }).waitFor();
  await page.goto(origin + '#benchmarks?search=CVE-Bench');
  await expect(page.locator('.benchmark-row')).toHaveCount(1);
  await page.locator('.benchmark-row').click();
  await page.getByRole('heading', { name: 'CVE-Bench — Model results' }).waitFor();
  await page.goto(origin + '#evidence?record=CAO-2026-0002');
  await page.getByRole('dialog').waitFor();
  await expect(page.locator('.reported-result strong')).toHaveText('90%');
  await page.getByRole('button', { name: '关闭结果详情' }).click();
  for (const file of [
    'data/audit.json',
    'downloads/results.csv',
    'downloads/audit-2026-10-18.xlsx',
  ])
    assert.equal((await page.request.get(origin + file)).status(), 200);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '#overview');
  await page.getByRole('heading', { name: 'AI Cybersecurity Benchmarks' }).waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Mobile overflow',
  );
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  await page.getByRole('button', { name: '展开导航' }).click();
  await page.getByRole('navigation').getByRole('link', { name: '模型', exact: true }).click();
  await page.getByRole('heading', { name: 'AI Models', exact: true }).waitFor();
  await expect(page.locator('table tbody tr')).toHaveCount(73);
  for (const [creator, count] of [
    ['Tencent', 3],
    ['Zhipu', 8],
    ['DeepSeek', 7],
    ['xAI', 7],
  ]) {
    await page.getByRole('combobox', { name: '筛选模型厂商', exact: true }).selectOption(creator);
    await expect(page.getByRole('table', { name: '模型列表' }).locator('tbody tr')).toHaveCount(
      count,
    );
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.goto(origin + '#models?model=deepseek-v4-1-flash-1017');
  await expect(page.getByRole('status')).toContainText('暂无可归属到该版本的已确认成绩');
  await page.goto(origin + '#overview?benchmark=CyberGym&creator=Tencent');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('78.4%');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('51.8%');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'test-results/vendors-mobile.png', fullPage: true });
  await page.goto(origin + '#overview?benchmark=CyberGym&creator=Zhipu&search=GLM-5');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('43.2%');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('48.3%');
  await page.goto(origin + '#overview?benchmark=CyberGym&creator=DeepSeek');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('88.1%');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('75.3%');
  await page.goto(
    origin +
      '#overview?benchmark=ExploitGym&creator=Zhipu&metric=' +
      encodeURIComponent('完成任务数|count'),
  );
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('130');
  await page.getByRole('combobox', { name: '筛选运行配置' }).selectOption('2 hours');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('105');
  await expect(page.getByRole('table', { name: '模型成绩表' })).not.toContainText('130');
  await page.goto(origin + '#overview?benchmark=Cybench&creator=xAI');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('53%');
  await page.goto(origin + '#overview?benchmark=HackerBench%20v0.3&creator=xAI');
  await expect(
    page.getByRole('heading', { name: '风险双用途提示放行率', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('3.3%');
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto(origin + '#overview?benchmark=CyberGym');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('Hy4 preview');
  await page.screenshot({ path: 'test-results/vendors-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '#overview?record=CAO-2026-0147');
  await page.getByRole('dialog').waitFor();
  assert.match(await page.locator('.reported-result strong').innerText(), /289\/869/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'test-results/result-mobile.png', fullPage: true });
  await page.goto(origin + '#overview?benchmark=CyberGym&creator=Tencent');
  await expect(page.getByRole('table', { name: '模型成绩表' })).toContainText('Tencent');
  const beforeLanguageSwitch = new URL(page.url()).hash;
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  assert.equal(new URL(page.url()).hash, beforeLanguageSwitch);
  await expect(page.getByRole('combobox', { name: 'Filter creator', exact: true })).toHaveValue(
    'Tencent',
  );
  await expect(page.getByRole('table', { name: 'Model results', exact: true })).toContainText(
    '78.4%',
  );
  assert.doesNotMatch(await page.locator('main').innerText(), /[\u3400-\u9fff]/);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Compare AI cybersecurity capabilities' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.screenshot({ path: 'test-results/english-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(origin + '#models');
  await expect(
    page.getByRole('table', { name: 'Model directory', exact: true }).locator('tbody tr'),
  ).toHaveCount(73);
  assert.doesNotMatch(await page.locator('main').innerText(), /[\u3400-\u9fff]/);
  await expect(
    page.getByRole('combobox', { name: 'Filter model creator' }).locator('option[value="Zhipu"]'),
  ).toHaveText('GLM');
  await page.goto(origin + '#models?model=deepseek-v4-flash');
  await expect(
    page.getByRole('heading', { name: 'Efficient general reasoning, coding and agents' }),
  ).toBeVisible();
  assert.doesNotMatch(await page.locator('main').innerText(), /[\u3400-\u9fff]/);
  await page.goto(origin + '#benchmarks');
  await expect(page.locator('.benchmark-row')).toHaveCount(54);
  assert.deepEqual((await page.locator('.benchmark-row h2').allTextContents()).slice(0, 6), [
    'ExploitBench',
    'CyberGym',
    'ExploitGym',
    'SEC-Bench Pro',
    'CyScenarioBench',
    'CVE-Bench',
  ]);
  assert.doesNotMatch(await page.locator('main').innerText(), /[\u3400-\u9fff]/);
  await page.goto(origin + '#overview?benchmark=CyberGym&creator=Tencent&record=CAO-2026-0255');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Later disclosure');
  assert.doesNotMatch(await page.getByRole('dialog').innerText(), /[\u3400-\u9fff]/);
  await expect(page.getByRole('link', { name: 'View report', exact: true })).toHaveAttribute(
    'href',
    'https://huggingface.co/tencent/Hy4-preview',
  );
  await page.getByRole('button', { name: 'Close result details' }).click();
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: 'test-results/english-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('combobox', { name: '筛选厂商', exact: true })).toHaveValue(
    'Tencent',
  );
  assert.deepEqual(errors, []);
  console.log(
    'Browser checks passed: comparison, metric conversion, filters, trend dates, profiles, deep links, keyboard focus, downloads and mobile.',
  );
} catch (e) {
  console.error(page.url(), errors);
  await page.screenshot({ path: 'test-results/failure.png', fullPage: true });
  throw e;
} finally {
  await browser.close();
}
