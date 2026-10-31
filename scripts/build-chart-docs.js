import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chartTypes } from '../src/core.js';
import { chartGroups, createDemo, createSnippet, demoCatalog } from '../examples/catalog.js';
import { apiReference, optionGroups, pointReference } from '../examples/reference.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sampledTypes = new Set(['line', 'spline', 'step', 'area', 'scatter', 'bubble']);
const radialTypes = new Set(['pie', 'donut', 'polar', 'radar', 'gauge']);
const partitionTypes = new Set(['treemap', 'funnel', 'pyramid']);
const horizontalTypes = new Set(['bar', 'stackedBar', 'bullet']);
const singleSeriesTypes = new Set(['pie', 'donut', 'gauge', 'treemap', 'funnel', 'pyramid']);
const paths = ['lineWidth', 'opacity', 'dash', 'markers', 'markerRadius', 'connectNulls'];
const bars = ['opacity', 'barWidth'];
const financial = ['lineWidth', 'opacity', 'dash', 'barWidth', 'upColor', 'downColor'];
const seriesFields = {
    line: paths, spline: paths, step: paths,
    area: [...paths, 'fillOpacity', 'baseline'],
    stackedArea: ['lineWidth', 'opacity', 'dash', 'fillOpacity'],
    column: bars, bar: bars, stackedColumn: bars, stackedBar: bars,
    scatter: ['opacity', 'markerRadius'], bubble: ['opacity', 'maxBubbleRadius'],
    pie: ['opacity', 'borderWidth'], donut: ['opacity', 'borderWidth', 'innerRadius'],
    polar: ['opacity'], radar: ['opacity', 'lineWidth', 'fillOpacity'],
    heatmap: ['opacity', 'cellWidth', 'cellHeight', 'colorMin', 'colorMax'],
    treemap: [], candlestick: financial, ohlc: financial,
    rangeArea: ['lineWidth', 'opacity', 'dash', 'fillOpacity'], rangeBar: bars,
    histogram: [...bars, 'bins'], boxplot: ['lineWidth', 'opacity', 'dash', 'barWidth'],
    waterfall: bars, funnel: [], pyramid: [], gauge: ['opacity', 'lineWidth'], bullet: bars
};
const xyFields = ['x', 'y', 'label'];
const valueFields = ['y', 'label', 'color'];
const pointFields = {
    line: [...xyFields, 'color'], spline: [...xyFields, 'color'], step: [...xyFields, 'color'],
    area: [...xyFields, 'color'], stackedArea: xyFields,
    column: [...xyFields, 'color'], bar: [...xyFields, 'color'],
    stackedColumn: [...xyFields, 'color'], stackedBar: [...xyFields, 'color'],
    scatter: [...xyFields, 'color'], bubble: [...xyFields, 'color', 'size'],
    pie: valueFields, donut: valueFields, polar: valueFields, radar: ['y', 'label'],
    heatmap: [...xyFields, 'color', 'value'], treemap: valueFields,
    candlestick: [...xyFields, 'low', 'high', 'open', 'close'],
    ohlc: [...xyFields, 'low', 'high', 'open', 'close'],
    rangeArea: [...xyFields, 'low', 'high'], rangeBar: [...xyFields, 'low', 'high', 'color'],
    histogram: ['y'], boxplot: [...xyFields, 'low', 'high', 'q1', 'q3', 'median', 'color'],
    waterfall: [...xyFields, 'color', 'total'], funnel: valueFields, pyramid: valueFields,
    gauge: ['y', 'label'], bullet: [...xyFields, 'color', 'high']
};
const defaults = {
    'series.id': 'Stringified series index', 'series.name': 'Series N',
    'series.type': 'options.type', 'series.data': 'Required', 'series.color': 'Palette color at series index',
    'options.colors': 'Built-in eight-color palette', 'options.textColor': 'Context-dependent: #243d36 or #485653',
    'options.performance.maxPoints': 'Twice plot width; minimum 4',
    'options.accessibility.label': 'options.title or Chart',
    'options.accessibility.description': 'Generated series summary',
    'options.dataLabels.color': 'Context-dependent text color',
    'props.height': '400', 'props.dataVersion': 'Unset',
    'options.margin.top': '20; 56 with a title', 'options.margin.right': '24',
    'options.margin.bottom': '42; 62 with an x-axis title; 20 for radial/partition charts',
    'options.margin.left': '64; 82 with a y-axis title; 20 for radial/partition charts'
};
const seriesExamples = {
    line: { lineWidth: 2, markers: true, markerRadius: 3, connectNulls: false },
    spline: { lineWidth: 2, markers: true, markerRadius: 3 },
    step: { lineWidth: 2, markers: true, markerRadius: 3 },
    area: { lineWidth: 2, fillOpacity: 0.25, baseline: 0 },
    stackedArea: { lineWidth: 2, fillOpacity: 0.35 },
    column: { barWidth: 28 }, bar: { barWidth: 28 },
    stackedColumn: { barWidth: 28 }, stackedBar: { barWidth: 28 },
    scatter: { markerRadius: 4, opacity: 0.8 }, bubble: { maxBubbleRadius: 28, opacity: 0.8 },
    pie: { borderWidth: 2 }, donut: { borderWidth: 2, innerRadius: 0.65 },
    polar: { opacity: 0.85 }, radar: { lineWidth: 2, fillOpacity: 0.15 },
    heatmap: { cellWidth: 1, cellHeight: 1, colorMin: 0, colorMax: 100 },
    treemap: {}, candlestick: { barWidth: 18, upColor: '#087f75', downColor: '#db5b39' },
    ohlc: { lineWidth: 2, barWidth: 18, upColor: '#087f75', downColor: '#db5b39' },
    rangeArea: { lineWidth: 1, fillOpacity: 0.25 }, rangeBar: { barWidth: 24 },
    histogram: { bins: 8, barWidth: 32 }, boxplot: { lineWidth: 2, barWidth: 24 },
    waterfall: { barWidth: 28 }, funnel: {}, pyramid: {}, gauge: { lineWidth: 18 }, bullet: { barWidth: 28 }
};

function escapeCell(value) {
    return String(value).replaceAll('|', String.raw`\|`).replaceAll('\n', ' ');
}

function table(headings, rows) {
    return [headings, headings.map(() => '---'), ...rows]
        .map(row => `| ${row.map(escapeCell).join(' | ')} |`).join('\n');
}

function defaultValue(field, type) {
    if (field.path === 'options.type' && type) return type;
    if (field.path === 'series.fillOpacity') {
        if (type === 'radar') return '0.15';
        if (type === 'stackedArea' || type === 'rangeArea') return '0.35';
        if (type === 'area') return '0.2';
        return '0.2 area; 0.35 stacked/range area; 0.15 radar';
    }
    if (field.path === 'series.lineWidth' && type === 'gauge') return 'max(8, radius * 0.16)';
    if (defaults[field.path]) return defaults[field.path];
    if (field.fallback === undefined || field.fallback === '') return 'Automatic / unset';
    return JSON.stringify(field.fallback);
}

function optionTable(fields, type) {
    return table(['Option', 'Value', 'Default', 'Behavior'], fields.map(field => [
        `\`${field.path}\``, field.choices ? field.choices.filter(Boolean).join(' / ') : field.kind,
        defaultValue(field, type), field.description
    ]));
}

function isCartesian(type) {
    return !radialTypes.has(type) && !partitionTypes.has(type);
}

function supportsZoom(type) {
    return isCartesian(type) && !horizontalTypes.has(type);
}

function supportsLabels(type) {
    return !sampledTypes.has(type) && type !== 'gauge';
}

function applicableAxis(path, type) {
    if (isCartesian(type)) return true;
    return ['radar', 'polar', 'gauge'].includes(type) && ['options.yAxis.min', 'options.yAxis.max'].includes(path);
}

function applicableGrid(path, type) {
    if (isCartesian(type)) return true;
    if (type === 'gauge') return path === 'options.grid.color';
    return ['radar', 'polar'].includes(type) && path !== 'options.grid.dash';
}

function applicableOption(field, type) {
    const path = field.path;
    if (!path.startsWith('options.')) return false;
    if (path.startsWith('options.xAxis.') || path.startsWith('options.yAxis.')) return applicableAxis(path, type);
    if (path.startsWith('options.grid.')) return applicableGrid(path, type);
    if (path.startsWith('options.zoom.')) return supportsZoom(type);
    if (path.startsWith('options.dataLabels.')) return supportsLabels(type) || (type === 'gauge' && path.endsWith('.formatter'));
    if (path === 'options.performance.maxPoints') return sampledTypes.has(type);
    if (path === 'options.performance.maxItems') return !sampledTypes.has(type);
    return true;
}

function pointDescription(type, name) {
    const description = pointReference.find(([field]) => field === name)[1];
    if (name === 'color' && ['line', 'spline', 'step', 'area'].includes(type)) return 'Marker fill override when markers are enabled; does not recolor the line stroke.';
    if (name === 'y' && ['candlestick', 'ohlc'].includes(type)) return 'Required representative y; usually equal to close. Supply OHLC fields separately.';
    if (name === 'y' && type === 'boxplot') return 'Required representative y; usually equal to median. Supply quartiles and whiskers separately.';
    if (name === 'y' && ['rangeArea', 'rangeBar'].includes(type)) return 'Required representative y inside the low/high interval; range fields define the geometry.';
    if (name === 'y' && type === 'histogram') return 'Raw sample value. Input x values are ignored when binning.';
    if (name === 'high' && type === 'bullet') return 'Optional target value drawn as a marker across the measured bar.';
    return description;
}

function pointRequirement(type, name) {
    if (name === 'y') return 'Required';
    if (name === 'x') return 'Optional; defaults to point index';
    if (type === 'bullet' && name === 'high') return 'Optional';
    if (['low', 'high', 'open', 'close', 'q1', 'q3', 'median'].includes(name)) return 'Supply for the documented shape';
    return 'Optional';
}

export function chartConfiguration(type) {
    const demo = createDemo(type, 8);
    const series = demo.series.map(item => {
        let data = item.data;
        if (sampledTypes.has(type)) data = [18, 24, 21, 32, 29].map((y, x) => type === 'bubble' ? { x, y, size: (x + 1) * 25 } : { x, y });
        if (type === 'histogram') data = [10, 12, 12, 14, 17, 18, 19, 20, 20, 23, 24, 27, 30, 32, 35, 38];
        if (['candlestick', 'ohlc', 'boxplot', 'rangeArea', 'rangeBar'].includes(type)) data = data.slice(0, 4);
        return { ...item, ...seriesExamples[type], data };
    });
    const options = {
        type, title: `${demoCatalog[type].title} example`, background: '#ffffff',
        tooltip: { enabled: true }, legend: { enabled: true },
        accessibility: { label: `${demoCatalog[type].title} observations`, table: true, maxRows: 20 }
    };
    if (isCartesian(type)) {
        options.xAxis = { title: type === 'histogram' ? 'Value bins' : 'Observation' };
        options.yAxis = { title: type === 'histogram' ? 'Frequency' : 'Value' };
        options.grid = { visible: true, color: '#e5e9e9' };
    }
    if (supportsZoom(type)) options.zoom = { enabled: true, pan: true };
    if (sampledTypes.has(type)) options.performance = { maxPoints: 2000 };
    else options.performance = { maxItems: 2000 };
    if (supportsLabels(type)) options.dataLabels = { enabled: true };
    if (['gauge', 'radar', 'polar'].includes(type)) options.yAxis = { min: 0, max: 100 };
    return { series, options, props: { width: '100%', height: 400 } };
}

function behaviorNotes(type) {
    const notes = [demoCatalog[type].notes];
    if (singleSeriesTypes.has(type)) notes.push('This type accepts exactly one visible series. Other chart families cannot be mixed into it.');
    else if (isCartesian(type)) notes.push('Vertical Cartesian types can be mixed with other vertical types. Horizontal and vertical families cannot share a chart.');
    if (horizontalTypes.has(type)) notes.push('xAxis describes the vertical category domain; yAxis describes horizontal values. Wheel/keyboard x zoom and pointer panning are not supported.');
    if (radialTypes.has(type) || partitionTypes.has(type)) notes.push('Cartesian axis titles, category ticks, and x zoom do not apply. Only the radial y limits listed below affect gauge/radar/polar geometry.');
    if (['line', 'spline', 'step', 'area'].includes(type)) notes.push('Null and non-finite observations split paths by default. connectNulls explicitly joins valid vertices across missing values.');
    if (sampledTypes.has(type)) notes.push('Dense XY charts omit data labels to keep drawing bounded. Tooltips select rendered sample points, not every original observation.');
    if (['candlestick', 'ohlc'].includes(type)) notes.push('upColor/downColor determine financial direction colors; series.color does not override them.');
    if (partitionTypes.has(type)) notes.push('Series opacity, lineWidth, dash, and borderWidth are not applied by this partition renderer. Use point/series colors and label options.');
    if (type === 'gauge') notes.push('The numeric value is always displayed. dataLabels.formatter customizes its text; dataLabels.enabled and dataLabels.color are not used.');
    return notes.map(note => `- ${note}`).join('\n');
}

function relatedLinks(type) {
    const family = Object.values(chartGroups).find(types => types.includes(type));
    return family.filter(name => name !== type).map(name => `- [${demoCatalog[name].title}](../${name}/README.md)`).join('\n');
}

function chartReadme(type) {
    const chart = demoCatalog[type];
    const fields = optionGroups.flatMap(group => group.fields);
    const allowed = new Set(['id', 'name', 'type', 'data', 'visible', 'color', ...seriesFields[type]]);
    const series = fields.filter(field => field.path.startsWith('series.') && allowed.has(field.path.slice(7)));
    const options = fields.filter(field => applicableOption(field, type));
    const dataRows = pointFields[type].map(name => [`\`${name}\``, pointRequirement(type, name), pointDescription(type, name)]);
    const demo = createDemo(type, 8);
    const snippet = createSnippet(demo, chartConfiguration(type));
    const performance = sampledTypes.has(type)
        ? 'Sorted x inputs use cached viewport lookup and min/max sampling. performance.maxPoints bounds drawn vertices per series; the default is twice the plot width (minimum 4). Initial indexing is synchronous O(n) and can pause the main thread. Sampling is visual, not an exact analytical aggregation. There is no fixed frame-rate guarantee.'
        : chart.performance;
    return `# ${chart.title} Chart\n\n${chart.description}\n\nChart type: \`${type}\`.\n\n[All charts](../README.md) | [Shared configuration](../../configuration/README.md) | [Package overview](../../../README.md)\n\n## Install\n\n\`\`\`sh\nnpm install @lp-labs/strata-react-charts\n\`\`\`\n\nRequires React 18 or 19. TypeScript declarations are included; no chart stylesheet is required.\n\n## React Example\n\n\`\`\`jsx\n${snippet.trim()}\n\`\`\`\n\nThe data is declared outside render to keep its identity stable. The example uses explicit settings; the tables below describe library defaults.\n\n## Data Fields\n\n${table(['Field', 'Requirement', 'Meaning'], dataRows)}\n\nNumeric arrays use their index as x; tuples use [x, y]; objects support named fields. Numeric column objects support typed arrays and optional numeric shape fields. Use object points for labels, colors, and waterfall total flags. All supplied columns should have matching lengths.\n\n## Series Configuration\n\n${optionTable(series, type)}\n\n## Chart Configuration\n\nOnly options relevant to this chart are listed. For all public options, callback signatures, and component props, see the [shared configuration reference](../../configuration/README.md).\n\n${optionTable(options, type)}\n\n## Behavior and Limitations\n\n${behaviorNotes(type)}\n\n## Performance and Updates\n\n${performance}\n\n${type === 'histogram' ? 'Histogram binning is exact and cached. bins defaults to 20 and may be 1..10000; performance.maxItems also limits the resulting bins, not the raw sample count.\n\n' : ''}Prefer a new data object when values change. In-place changes require invalidateData(data) and a changed dataVersion or ref.redraw(). Changing dataVersion alone does not invalidate cached indexes. The first index and each invalidation cost O(n).\n\n## Interaction and Export\n\nTooltips and onPointClick use rendered geometry. The legend toggles visible series. Provide accessibility.label and an optional bounded data table.\n\n${supportsZoom(type) ? 'With zoom.enabled, wheel/+/- zoom x, pointer dragging pans, arrow keys pan, and Home/double-click reset. Escape dismisses the tooltip. Pinch gestures and drag-to-select are not implemented.' : 'This chart does not support x-axis zoom or pointer panning.'}\n\nUse a React ref for getCanvas(), getFrame(), redraw(), and exportImage(type?, quality?). Image export defaults to PNG and excludes HTML legend/tooltip overlays. See the [ref and callback reference](../../configuration/README.md#callbacks-and-ref-methods).\n\n## Related Charts\n\n${relatedLinks(type)}\n`;
}

function groupSection([name, types]) {
    const links = types.map(type => `- [${demoCatalog[type].title}](${type}/README.md): ${demoCatalog[type].description}`).join('\n');
    return `## ${name}\n\n${links}`;
}

function chartsIndex() {
    const sections = Object.entries(chartGroups).map(groupSection).join('\n\n');
    return `# Chart Configuration Guides\n\nA separate README for every supported chart type. Each guide includes a complete React example, data fields, applicable series/chart settings, defaults, interaction behavior, and performance limits.\n\n[Package overview](../../README.md) | [Shared configuration](../configuration/README.md)\n\n${sections}\n`;
}

function sharedReadme() {
    const sections = optionGroups.map(group => `## ${group.title}\n\n${optionTable(group.fields)}`).join('\n\n');
    const callbacks = table(['API', 'Contract'], apiReference.map(([name, description]) => [`\`${name}\``, description]));
    const points = table(['Field', 'Contract'], pointReference.map(([name, description]) => [`\`${name}\``, description]));
    return `# Shared Chart Configuration\n\n[Chart guides](../charts/README.md) | [Package overview](../../README.md)\n\nThis reference lists the full public configuration surface. Options apply only to their documented chart families; each [chart README](../charts/README.md) lists its relevant subset. Library defaults differ from the explicit values used in examples.\n\nSet chart-wide options through options, per-series settings through series entries, and component settings directly on Chart. Series-level type overrides options.type. Object-point color takes precedence where that renderer supports point colors.\n\n${sections}\n\n## Point Fields\n\n${points}\n\n## Callbacks and Ref Methods\n\n${callbacks}\n\nUse useRef(null) and pass ref to Chart for imperative methods. getCanvas() and getFrame() return null before drawing; exportImage() returns null before mount. Callbacks and hooks are JavaScript functions, not JSON strings. Tooltip formatters return plain text, never injected HTML.\n\n## Configuration Rules\n\n- React 18 or 19 is the only peer dependency; there are no runtime dependencies.\n- Both package entry points are ESM and include TypeScript declarations. Import ChartOptions, Series, ChartProps, and ChartHandle from the package when needed.\n- Axis limits must be finite and min must be less than max. Time axes accept epoch milliseconds.\n- Canvas colors/fonts use browser-supported CSS values; load custom fonts before drawing.\n- Keep data immutable by identity, or explicitly invalidateData(data) before triggering a redraw.\n- Use stable unique series IDs for hiddenSeries and legend behavior.\n- Style the outer figure using the component style prop; canvas styling uses chart/series options.\n- Drawing hooks receive logical CSS-pixel coordinates. Keep canvas save/restore balanced and clip overlays yourself.\n- Detailed chart families reject inputs above maxItems instead of silently sampling. Dense sampling does not guarantee exact density, bubble size distribution, or analytics.\n- Unsupported options such as logarithmic/multiple axes, SVG/PDF export, and automatic workers are not implemented.\n`;
}

export function chartDocuments() {
    const documents = new Map([
        ['docs/charts/README.md', chartsIndex()],
        ['docs/configuration/README.md', sharedReadme()]
    ]);
    for (const type of chartTypes) documents.set(`docs/charts/${type}/README.md`, chartReadme(type));
    return documents;
}

export async function buildChartDocs({ check = false } = {}) {
    const documents = chartDocuments();
    await Promise.all([...documents].map(async ([name, contents]) => {
        const path = join(root, name);
        if (check) {
            const existing = await readFile(path, 'utf8');
            if (existing !== contents) throw new Error(`Stale chart documentation: ${name}. Run npm run docs:charts.`);
            return;
        }
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, contents);
    }));
    return documents.size;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    const check = process.argv.includes('--check');
    const count = await buildChartDocs({ check });
    console.log(`${check ? 'Verified' : 'Generated'} ${count} chart documentation READMEs.`);
}