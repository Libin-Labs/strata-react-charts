import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { chartTypes, renderChart } from '../src/core.js';
import { buildChartDocs, chartConfiguration, chartDocuments } from '../scripts/build-chart-docs.js';

test('every chart has a dedicated README with configuration and a valid React example', () => {
    const documents = chartDocuments();
    assert.equal(documents.size, chartTypes.length + 2);
    for (const type of chartTypes) {
        const document = documents.get(`docs/charts/${type}/README.md`);
        assert.ok(document, type);
        for (const section of ['React Example', 'Data Fields', 'Series Configuration', 'Chart Configuration', 'Behavior and Limitations', 'Performance and Updates', 'Interaction and Export']) {
            assert.ok(document.includes(`## ${section}`), `${type}: ${section}`);
        }
        const snippet = document.match(/```jsx\n([\s\S]*?)\n```/)[1];
        const prelude = snippet.slice(snippet.indexOf('\n\n') + 2, snippet.indexOf('export default'));
        const result = new Script(`${prelude}\n({ series, options });`).runInNewContext();
        assert.equal(result.options.type, type);
        assert.equal(result.series.length, chartConfiguration(type).series.length);
        const context = new Proxy({}, {
            get: (target, key) => key in target ? target[key] : (...args) => {
                assert.ok(args.filter(value => typeof value === 'number').every(Number.isFinite), `${type}: ${String(key)}`);
            },
            set: (target, key, value) => { target[key] = value; return true; }
        });
        assert.ok(renderChart(context, { width: 800, height: 400, ...result }).hits.length > 0, type);
    }
});

test('guides distinguish relevant options and chart-dependent defaults', () => {
    const documents = chartDocuments();
    const guide = type => documents.get(`docs/charts/${type}/README.md`);
    assert.match(guide('radar'), /series.fillOpacity` \| number \| 0.15/);
    assert.match(guide('rangeArea'), /series.fillOpacity` \| number \| 0.35/);
    assert.match(guide('gauge'), /max\(8, radius \* 0.16\)/);
    assert.doesNotMatch(guide('pie'), /`options.xAxis.min`/);
    assert.doesNotMatch(guide('bar'), /`options.zoom.enabled`/);
    assert.doesNotMatch(guide('treemap'), /`series.opacity`/);
    assert.match(guide('candlestick'), /`series.upColor`/);
    assert.match(guide('bubble'), /`series.maxBubbleRadius`/);
    assert.match(guide('heatmap'), /`series.colorMax`/);
    assert.match(guide('bullet'), /`high` \| Optional \| Optional target/);
});

test('checked-in chart READMEs are current and all local links resolve', async () => {
    assert.equal(await buildChartDocs({ check: true }), chartTypes.length + 2);
    for (const [name, contents] of chartDocuments()) {
        const document = new URL(`../${name}`, import.meta.url);
        const markdown = contents.replace(/```[\s\S]*?```/g, '');
        for (const [, href] of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
            const target = new URL(href.split('#')[0], document);
            await readFile(target, 'utf8');
        }
    }
});

test('npm manifest includes the separate chart documentation', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.ok(manifest.files.includes('docs'));
    const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
    assert.match(readme, /\(docs\/charts\/README.md\)/);
    assert.match(readme, /\(docs\/configuration\/README.md\)/);
});