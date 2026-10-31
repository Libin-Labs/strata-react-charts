import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Chart } from '../src/index.js';
import { Documentation } from '../examples/docs.js';
import { createDemo, resolveDemo } from '../examples/catalog.js';
test('React component is SSR-safe with semantic fallback and bounded data table', () => {
    const html = renderToString(React.createElement(Chart, { series: [{ name: 'Revenue', data: [1, 2, 3] }], options: { title: 'Revenue chart', accessibility: { table: true, maxRows: 2 } } }));
    assert.match(html, /Revenue chart/);
    assert.match(html, /<canvas/);
    assert.match(html, /aria-pressed="true"/);
    assert.equal((html.match(/<td>Revenue<\/td>/g) ?? []).length, 2);
});
test('legend and accessible table are optional', () => {
    const html = renderToString(React.createElement(Chart, { series: [], options: { legend: { enabled: false } } }));
    assert.doesNotMatch(html, /<button/);
    assert.doesNotMatch(html, /<table/);
});

test('documentation panels render chart guides, code, controls, and reference tables', () => {
    const demo = createDemo('candlestick');
    for (const tab of ['guide', 'code', 'playground', 'reference']) {
        const html = renderToString(React.createElement(Documentation, {
            type: 'candlestick', demo, configuration: resolveDemo(demo), changes: {}, tab,
            onTabChange() {}, onChange() {}, onReset() {}
        }));
        assert.match(html, /role="tabpanel"/);
        assert.match(html, /role="tablist"/);
        if (tab === 'guide') assert.match(html, /Financial data is not sampled/);
        if (tab === 'code') assert.match(html, /@lp-labs\/strata-react-charts/);
        if (tab === 'playground') assert.match(html, /series.innerRadius/);
        if (tab === 'reference') assert.match(html, /exportImage/);
    }
});
