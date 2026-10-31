import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartTypes, renderChart } from '../src/renderer.js';
function mockContext() {
    const calls = [];
    return new Proxy({ calls, measureText: text => ({ width: String(text).length * 7 }) }, {
        get(target, key) { return key in target ? target[key] : (...args) => { assert.ok(args.filter(value => typeof value === 'number').every(Number.isFinite), `${String(key)} received a non-finite argument`); calls.push([key, ...args]); }; },
        set(target, key, value) { target[key] = value; return true; }
    });
}
const data = Array.from({ length: 8 }, (_, index) => ({ x: index, y: index + 2, low: index, high: index + 6, open: index + 2, close: index + 4, q1: index + 1, q3: index + 5, median: index + 3, value: index * 12, size: index * 4, label: `Point ${index}` }));
for (const type of chartTypes)
    test(`${type} renders finite geometry and exposes hits`, () => {
        const context = mockContext();
        const frame = renderChart(context, { width: 800, height: 400, series: [{ data }], options: { type, dataLabels: { enabled: true } } });
        assert.ok(frame.hits.length > 0);
        assert.ok(context.calls.some(call => call[0] === 'fillRect'));
        assert.ok(frame.hitTest(frame.hits[0].x, frame.hits[0].y));
    });
test('stacked domains account for positive and negative sums', () => {
    const frame = renderChart(mockContext(), { width: 800, height: 400, series: [{ data: [5, -4] }, { data: [6, -8] }], options: { type: 'stackedColumn' } });
    assert.deepEqual(frame.yDomain, [-12, 11]);
});
test('null gaps split line paths unless explicitly connected', () => {
    const context = mockContext();
    renderChart(context, { width: 800, height: 400, series: [{ data: [1, null, 2] }], options: { grid: { visible: false }, xAxis: { visible: false }, yAxis: { visible: false } } });
    assert.equal(context.calls.filter(call => call[0] === 'moveTo').length, 2);
});

test('connectNulls joins valid vertices across missing values', () => {
    const context = mockContext();
    renderChart(context, {
        width: 800,
        height: 400,
        series: [{ data: [1, null, 2], connectNulls: true }],
        options: {
            grid: { visible: false },
            xAxis: { visible: false },
            yAxis: { visible: false }
        }
    });
    assert.equal(context.calls.filter(call => call[0] === 'moveTo').length, 1);
    assert.equal(context.calls.filter(call => call[0] === 'lineTo').length, 1);
});
test('rejects unsupported types, misleading mixed orientations, and detailed overflow', () => {
    const draw = options => renderChart(mockContext(), { width: 800, height: 400, series: [{ data }], options });
    assert.throws(() => draw({ type: 'unknown' }), /Unsupported/);
    assert.throws(() => draw({ type: 'candlestick', performance: { maxItems: 2 } }), /maxItems/);
    assert.throws(() => draw({ xAxis: { min: 4, max: 1 } }), /Axis/);
    assert.throws(() => renderChart(mockContext(), { width: 800, height: 400, series: [{ type: 'bar', data }, { type: 'line', data }] }), /Horizontal/);
});
test('million-point render work stays bounded after indexing', () => {
    const series = [{ data: { y: Float32Array.from({ length: 1000000 }, (_, index) => Math.sin(index / 100)) } }];
    const frame = renderChart(mockContext(), { width: 800, height: 400, series, options: { performance: { maxPoints: 1000 } } });
    assert.ok(frame.hits.length <= 1000);
});
test('bar interiors are clickable and waterfall hits follow cumulative endpoints', () => {
    const bar = renderChart(mockContext(), { width: 800, height: 400, series: [{ data: [50] }], options: { type: 'bar' } });
    const bounds = bar.hits[0].rect;
    assert.equal(bar.hitTest(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)?.index, 0);
    const waterfall = renderChart(mockContext(), { width: 800, height: 400, series: [{ data: [10, 5, -2] }], options: { type: 'waterfall' } });
    assert.equal(waterfall.hits[1].y, waterfall.y(15));
});
test('radar series share the same scale', () => {
    const frame = renderChart(mockContext(), { width: 800, height: 400, series: [{ data: [5, 5, 5] }, { data: [10, 10, 10] }], options: { type: 'radar' } });
    const centerY = frame.plot.top + frame.plot.height / 2;
    assert.ok(Math.abs((centerY - frame.hits[0].y) * 2 - (centerY - frame.hits[3].y)) < 0.001);
});
test('empty gauges and missing radial values do not produce invalid geometry', () => {
    for (const type of ['gauge', 'radar', 'polar', 'pie', 'donut']) {
        renderChart(mockContext(), { width: 400, height: 300, series: [{ data: [] }], options: { type } });
        renderChart(mockContext(), { width: 400, height: 300, series: [{ data: [1, null, NaN, 3] }], options: { type } });
    }
});
test('donut hole is not a sector hit', () => {
    const frame = renderChart(mockContext(), { width: 400, height: 300, series: [{ data: [1, 2, 3] }], options: { type: 'donut' } });
    const sector = frame.hits[0].sector;
    assert.equal(frame.hitTest(sector.centerX, sector.centerY), null);
});
