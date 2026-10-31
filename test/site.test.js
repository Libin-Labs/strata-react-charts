import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../scripts/build-site.js';
import { chartTypes } from '../src/core.js';
import { createDemo, createSnippet, demoCatalog, resolveDemo } from '../examples/catalog.js';
import { optionGroups, pointReference } from '../examples/reference.js';
import { Script } from 'node:vm';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('Pages build includes local assets and repository-relative entry points', async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'strata-pages-'));
    try {
        const output = await buildSite(join(temporary, 'site'));
        const html = await readFile(join(output, 'examples/index.html'), 'utf8');
        assert.doesNotMatch(html, /(?:src|href)="\//);
        assert.match(html, /\.\/vendor\/react.js/);
        const app = await readFile(join(output, 'examples/app.js'), 'utf8');
        assert.match(app, /from '.\/docs.js'/);
        for (const name of ['src/index.js', 'src/renderer.js', 'examples/app.js', 'examples/style.css', 'examples/react.js', 'examples/vendor/react.js', 'examples/vendor/react-dom.js', 'examples/vendor/react.LICENSE.txt', '.nojekyll', 'README.md', 'docs/charts/README.md', 'docs/charts/line/README.md', 'docs/configuration/README.md']) {
            assert.ok((await stat(join(output, name))).isFile(), name);
        }
        const root = await readFile(join(output, 'index.html'), 'utf8');
        assert.match(root, /url=\.\/examples\//);
    } finally {
        await rm(temporary, { recursive: true, force: true });
    }
});

test('every chart has a guide and executable generated data/options code', () => {
    assert.deepEqual(Object.keys(demoCatalog), [...chartTypes]);
    for (const type of chartTypes) {
        const demo = createDemo(type);
        const configuration = resolveDemo(demo);
        const snippet = createSnippet(demo, configuration);
        assert.ok(demoCatalog[type].fields.length > 0);
        assert.ok(demoCatalog[type].notes.length > 20);
        const prelude = snippet.slice(snippet.indexOf('\n\n') + 2, snippet.indexOf('export default'));
        const generated = new Script(`${prelude}\n({ series, options, chartProps });`).runInNewContext();
        assert.equal(generated.options.type, type);
        assert.equal(generated.series.length, configuration.series.length);
        assert.ok(generated.series[0].data);
    }
});

test('option reference covers every public chart, axis, series, and point field', async () => {
    const declarations = await readFile(new URL('../src/core.d.ts', import.meta.url), 'utf8');
    const paths = optionGroups.flatMap(group => group.fields.map(field => field.path));
    for (const [name, prefix] of [['ChartOptions', 'options'], ['Series', 'series'], ['AxisOptions', 'options.xAxis'], ['AxisOptions', 'options.yAxis']]) {
        const body = declarations.match(new RegExp(`export interface ${name} \\{([\\s\\S]*?)^\\}`, 'm'))?.[1];
        assert.ok(body, name);
        const properties = [...body.matchAll(/^ {4}(\w+)\??:/gm)].map(match => match[1]);
        for (const property of properties) {
            assert.ok(paths.some(path => path === `${prefix}.${property}` || path.startsWith(`${prefix}.${property}.`)), `${name}.${property}`);
        }
    }
    const point = declarations.match(/export interface Point \{([\s\S]*?)^\}/m)[1];
    for (const [, property] of point.matchAll(/^ {4}(\w+)\??:/gm)) assert.ok(pointReference.some(([name]) => name === property), property);
    assert.equal(new Set(paths).size, paths.length);
});

test('snippet follows edits without copying million-point buffers', () => {
    const demo = createDemo('line', 1_000_000);
    const configuration = resolveDemo(demo, { 'series.lineWidth': 4, 'options.grid.visible': false });
    const snippet = createSnippet(demo, configuration);
    assert.ok(snippet.length < 12000);
    assert.match(snippet, /createColumns\(1000000/);
    assert.equal(configuration.series[0].data, demo.series[0].data);
    assert.equal(configuration.series[0].lineWidth, 4);
    assert.equal(configuration.options.grid.visible, false);
});

test('example selection rejects unknown and inherited object names', () => {
    for (const type of ['unknown', 'constructor', 'toString', '__proto__']) {
        assert.throws(() => createDemo(type), /Unknown example/);
    }
});

test('preview serves relative assets under a repository prefix', { timeout: 10000 }, async context => {
    const child = spawn(process.execPath, ['examples/server.js', '--base=/chart-library'], {
        cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    try {
        const [message] = await once(child.stdout, 'data', { signal: context.signal });
        const port = String(message).match(/127\.0\.0\.1:(\d+)/)?.[1];
        assert.ok(port, String(message));
        const origin = `http://127.0.0.1:${port}`;
        const response = await fetch(`${origin}/chart-library/`);
        assert.ok(response.url.endsWith('/chart-library/examples/'));
        for (const asset of ['examples/app.js', 'examples/docs.js', 'examples/catalog.js', 'examples/vendor/react.js', 'examples/vendor/react-dom.js', 'src/index.js', 'README.md', 'docs/charts/README.md', 'docs/charts/line/README.md']) {
            assert.equal((await fetch(`${origin}/chart-library/${asset}`)).status, 200, asset);
        }
        assert.equal((await fetch(`${origin}/examples/app.js`)).status, 404);
    } finally {
        child.kill();
    }
});