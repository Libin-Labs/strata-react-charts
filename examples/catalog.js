import { chartTypes } from '../src/core.js';

export const titleCase = text => text.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
export const chartGroups = {
    'Time series': ['line', 'spline', 'step', 'area', 'stackedArea'],
    Comparison: ['column', 'bar', 'stackedColumn', 'stackedBar', 'bullet', 'waterfall'],
    Distribution: ['scatter', 'bubble', 'histogram', 'boxplot', 'heatmap'],
    Composition: ['pie', 'donut', 'treemap', 'funnel', 'pyramid'],
    Financial: ['candlestick', 'ohlc', 'rangeArea', 'rangeBar'],
    Radial: ['radar', 'polar', 'gauge']
};
export const denseTypes = new Set(['line', 'spline', 'step', 'area', 'scatter', 'bubble', 'histogram']);
const descriptions = {
    line: ['Connect observations in input order.', 'x, y', 'Use sorted x values for fast viewport lookup. Missing values break the line unless connectNulls is enabled.'],
    spline: ['Smooth an XY series using cubic midpoint interpolation.', 'x, y', 'Interpolation is visual, not a statistical fit. Use line for exact straight-segment geometry.'],
    step: ['Show values that remain constant until the next observation.', 'x, y', 'Steps move horizontally, then vertically at the next x position.'],
    area: ['Fill a time series down to a chosen baseline.', 'x, y', 'The baseline defaults to zero and is clipped to the visible y domain.'],
    stackedArea: ['Compare cumulative contributions across aligned observations.', 'x, y', 'Align and sort x values across series. Positive and negative values accumulate separately. Detailed-item limits apply.'],
    column: ['Compare categories with grouped vertical bars.', 'x, y', 'Add series with matching x values for grouped comparisons. barWidth is a pixel cap.'],
    bar: ['Compare categories with grouped horizontal bars.', 'x, y', 'xAxis describes the vertical category domain; yAxis describes horizontal values. X zoom is not supported.'],
    stackedColumn: ['Compare total values and contributions using vertical stacks.', 'x, y', 'Stacks match numeric x values; negative values form a separate stack below zero.'],
    stackedBar: ['Compare contributions using horizontal stacks.', 'x, y', 'Use matching x values across series. Horizontal and vertical chart families cannot be mixed.'],
    scatter: ['Inspect relationships between numeric x and y observations.', 'x, y', 'Large-data sampling retains y extrema, not density. Pre-aggregate for accurate density analysis.'],
    bubble: ['Add a third magnitude to an XY scatter plot.', 'x, y, size', 'Radius is the square root of size, capped by maxBubbleRadius. Sampling does not preserve the size distribution.'],
    pie: ['Show parts of a positive-valued total.', 'y; optional label, color', 'One series only. Zero, negative, and missing values have no sector.'],
    donut: ['Show composition with a central opening.', 'y; optional label, color', 'innerRadius is a fraction from zero to 0.95. One series only.'],
    polar: ['Display categories as equally spaced radial sectors.', 'y; optional label, color', 'Categories use equal angles. yAxis min/max control radial distance; nonnegative data is recommended.'],
    radar: ['Compare profiles across equally spaced categories.', 'y; optional label', 'All series share the radial scale. Keep category order and count aligned across series.'],
    heatmap: ['Encode a value as cell color intensity.', 'x, y, value', 'cellWidth and cellHeight are axis units. colorMin/colorMax define a single-hue alpha scale.'],
    treemap: ['Compare positive values as rectangular areas.', 'y; optional label, color', 'One flat series with a binary slice layout. Hierarchical and squarified layouts are not implemented.'],
    candlestick: ['Show open, high, low, and close for each interval.', 'x, y = close, open, high, low, close', 'Financial data is not sampled. Aggregate to OHLC intervals before passing very large inputs.'],
    ohlc: ['Show interval ranges with opening and closing ticks.', 'x, y = close, open, high, low, close', 'Open ticks extend left; close ticks extend right. Use upColor/downColor for direction.'],
    rangeArea: ['Display a band between lower and upper values.', 'x, y, low, high', 'Supply representative y values as well as range fields. Range data is not sampled.'],
    rangeBar: ['Compare low-to-high intervals using vertical bars.', 'x, y, low, high', 'These are vertical interval bars, not a horizontal timeline or Gantt chart.'],
    histogram: ['Count raw numeric observations in equal-width bins.', 'raw numeric y values', 'Binning is exact and cached. The detailed-item limit applies to output bins, not the raw sample count.'],
    boxplot: ['Compare precomputed distribution summaries.', 'x, y = median, low, q1, median, q3, high', 'Compute quartiles and whiskers yourself. The library does not infer statistics or detect outliers.'],
    waterfall: ['Show increments, decrements, and explicit totals.', 'y; optional total', 'A point with total: true resets the accumulated total to its y value.'],
    funnel: ['Compare sequential positive-valued stages.', 'y; optional label, color', 'Stage heights are proportional to values; widths follow adjacent stage values. Input order is preserved.'],
    pyramid: ['Display positive-valued stages in a pyramid.', 'y; optional label, color', 'Stage heights follow values; widths follow vertical position. One series only.'],
    gauge: ['Show one value within a half-circle progress range.', 'first point y', 'Set yAxis min/max for the value range; defaults are 0 and 100. Only the first point is drawn.'],
    bullet: ['Compare a horizontal measured value against a target.', 'x, y, high = target', 'high sets the target marker, not a range fill. Horizontal x zoom is not supported.']
};

export const demoCatalog = Object.fromEntries(chartTypes.map(type => [type, {
    type,
    title: titleCase(type),
    group: Object.keys(chartGroups).find(group => chartGroups[group].includes(type)),
    description: descriptions[type][0],
    fields: descriptions[type][1],
    notes: descriptions[type][2],
    performance: denseTypes.has(type)
        ? 'Accepts large numeric input. XY charts use bounded min/max sampling; histograms use cached binning. Initial indexing is synchronous O(n).'
        : 'Detailed geometry is not silently sampled. The default limit is 2,000 items per series; aggregate first or explicitly raise performance.maxItems.'
}]));

export function createColumns(count, type) {
    const x = Float64Array.from({ length: count }, (_, index) => index);
    const y = Float64Array.from({ length: count }, (_, index) => 62 + Math.sin(index / count * 30) * 12 + Math.cos(index / count * 97) * 4 + Math.sin(index * 17.31) * 2 + index / count * 8);
    if (type !== 'bubble') return { x, y };
    const size = Float32Array.from({ length: count }, (_, index) => 16 + (index % 12) * 9);
    return { x, y, size };
}

const samples = new Map();
const categoryPoints = () => [42, 64, 51, 78, 57, 91, 74, 85].map((y, x) => ({
    x, y, label: ['North', 'South', 'East', 'West', 'Central', 'Coastal', 'Metro', 'Rural'][x]
}));

function detailedData(type) {
    if (type === 'gauge') return [{ y: 72, label: 'Capacity' }];
    if (type === 'waterfall') return [{ y: 120, label: 'Opening' }, { y: 35, label: 'Sales' }, { y: -24, label: 'Costs' }, { y: 18, label: 'Other' }, { y: 149, total: true, label: 'Closing' }];
    if (type === 'heatmap') return Array.from({ length: 48 }, (_, index) => ({ x: index % 8, y: Math.floor(index / 8), value: (index * 37) % 101 }));
    if (type === 'funnel' || type === 'pyramid') return [100, 82, 61, 43, 26].map((y, index) => ({ y, label: ['Visitors', 'Engaged', 'Qualified', 'Trial', 'Paid'][index] }));
    return categoryPoints().map(point => {
        if (type === 'bullet') return { ...point, high: point.y + 12 };
        if (type === 'rangeArea' || type === 'rangeBar') return { ...point, low: point.y - 12, high: point.y + 15 };
        if (type === 'boxplot') return { ...point, low: point.y - 20, q1: point.y - 9, median: point.y, q3: point.y + 8, high: point.y + 18 };
        if (type === 'candlestick' || type === 'ohlc') {
            const open = point.y + (point.x % 2 ? 7 : -7);
            return { ...point, open, close: point.y, low: Math.min(open, point.y) - 8, high: Math.max(open, point.y) + 10 };
        }
        return point;
    });
}

export function createDemo(type, count = 120) {
    if (!Object.hasOwn(demoCatalog, type)) throw new TypeError(`Unknown example: ${type}`);
    const key = `${type}:${denseTypes.has(type) ? count : 0}`;
    if (samples.has(key)) return samples.get(key);
    const data = denseTypes.has(type) ? createColumns(count, type) : detailedData(type);
    const series = [{ id: 'primary', name: 'Observed', data }];
    if (type.startsWith('stacked') || type === 'radar') series.push({ id: 'previous', name: 'Previous period', data: data.map(point => ({ ...point, y: point.y * 0.58 })) });
    const options = {
        type, fontFamily: 'Trebuchet MS',
        margin: { left: 52, right: 24, top: 24, bottom: 42 },
        xAxis: { tickCount: 5 }, yAxis: { tickCount: 4 },
        grid: { color: '#e5e9e9' }, performance: { maxPoints: 1800 },
        accessibility: { label: `${titleCase(type)} example` }
    };
    if (type === 'gauge') options.yAxis = { min: 0, max: 100 };
    const demo = { series, options, count: denseTypes.has(type) ? count : data.length, generated: denseTypes.has(type) };
    samples.set(key, demo);
    return demo;
}

export function setPath(object, path, value) {
    const [key, ...remaining] = path.split('.');
    if (!remaining.length) return { ...object, [key]: value };
    return { ...object, [key]: setPath(object?.[key], remaining.join('.'), value) };
}

export function resolveDemo(demo, changes = {}) {
    let result = { options: demo.options, series: demo.series[0], props: { width: '100%', height: 380 } };
    for (const [path, value] of Object.entries(changes)) result = setPath(result, path, value);
    return { options: result.options, series: [result.series, ...demo.series.slice(1)], props: result.props };
}

export function serializeCode(value, references = new Map(), depth = 0) {
    if (references.has(value)) return references.get(value);
    if (typeof value === 'function') return value.toString();
    if (value === undefined) return 'undefined';
    if (ArrayBuffer.isView(value)) return `${value.constructor.name}.from(${serializeCode(Array.from(value), references, depth)})`;
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    const indent = '    '.repeat(depth);
    const next = `${indent}    `;
    const entries = Array.isArray(value)
        ? value.map(item => serializeCode(item, references, depth + 1))
        : Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${serializeCode(item, references, depth + 1)}`);
    if (!entries.length) return Array.isArray(value) ? '[]' : '{}';
    const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}'];
    return `${open}\n${next}${entries.join(`,\n${next}`)}\n${indent}${close}`;
}

export function createSnippet(demo, configuration) {
    const references = new Map();
    let dataSource = '';
    if (demo.generated && configuration.series[0].data === demo.series[0].data) {
        dataSource = `${createColumns.toString()}\n\nconst data = createColumns(${demo.count}, ${JSON.stringify(demo.options.type)});\n\n`;
        references.set(demo.series[0].data, 'data');
    }
    return `import { Chart } from '@lp-labs/strata-react-charts';\n\n${dataSource}const series = ${serializeCode(configuration.series, references)};\n\nconst options = ${serializeCode(configuration.options)};\n\nconst chartProps = ${serializeCode(configuration.props)};\n\nexport default function Example() {\n    return (\n        <Chart\n            {...chartProps}\n            series={series}\n            options={options}\n            onPointClick={hit => console.log('Selected', hit)}\n            onHover={hit => console.log('Hover', hit)}\n            onViewportChange={range => console.log('Viewport', range)}\n            onError={error => console.error(error)}\n        />\n    );\n}\n`;
}