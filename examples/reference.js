import { chartTypes } from '../src/core.js';

const number = value => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
const fixed = value => value.toFixed(2);
const date = value => new Date(value).toISOString().slice(0, 10);
const pointLabel = point => point.label ?? String(point.y);
const pointValue = point => Number(point.y).toFixed(2);
const tooltipLabel = hit => `${hit.series.name ?? 'Series'} / ${hit.point.label ?? hit.point.x}: ${hit.point.y}`;

function threshold(context, frame) {
    context.save();
    context.strokeStyle = '#db5b39';
    context.setLineDash([6, 4]);
    context.beginPath();
    context.moveTo(frame.plot.left, frame.y(60));
    context.lineTo(frame.plot.right, frame.y(60));
    context.stroke();
    context.restore();
}

function watermark(context, frame) {
    context.save();
    context.fillStyle = '#718078';
    context.font = '12px sans-serif';
    context.textAlign = 'right';
    context.fillText('Strata example', frame.plot.right - 8, frame.plot.top + 16);
    context.restore();
}

export const functionPresets = {
    axis: { Default: undefined, Number: number, 'Fixed decimals': fixed, 'ISO date': date },
    label: { Default: undefined, 'Point label': pointLabel, 'Fixed value': pointValue },
    tooltip: { Default: undefined, 'Series and value': tooltipLabel },
    hook: { None: undefined, 'Threshold at 60': threshold, Watermark: watermark }
};

function field(path, label, kind, fallback, description, extra = {}) {
    return { path, label, kind, fallback, description, ...extra };
}

const axisFields = axis => [
    field(`options.${axis}.min`, 'Minimum', 'number', '', 'Explicit finite lower bound; less than maximum.'),
    field(`options.${axis}.max`, 'Maximum', 'number', '', 'Explicit finite upper bound; greater than minimum.'),
    field(`options.${axis}.visible`, 'Visible', 'boolean', true, 'Cartesian axis ticks and labels.'),
    field(`options.${axis}.tickCount`, 'Tick intervals', 'number', 5, 'Between 2 and 20 intervals.', { min: 2, max: 20 }),
    field(`options.${axis}.formatter`, 'Tick formatter', 'function', undefined, 'Function (numeric value) => string.', { presets: 'axis' }),
    field(`options.${axis}.categories`, 'Category labels', 'json', undefined, 'Array of strings, indexed by rounded tick value.'),
    field(`options.${axis}.type`, 'Scale type', 'select', 'linear', 'Time expects epoch milliseconds; logarithmic scales are not implemented.', { choices: ['linear', 'time'] }),
    field(`options.${axis}.title`, 'Axis title', 'text', '', 'Increase margins for long axis titles.'),
    field(`options.${axis}.color`, 'Axis color', 'color', '#485653', 'Tick and axis-title text color.')
];

export const optionGroups = [
    { title: 'Chart appearance', fields: [
        field('options.type', 'Chart type', 'select', 'line', 'Default type for series without their own type.', { choices: chartTypes }),
        field('options.title', 'Title', 'text', '', 'Canvas title, included in image export.'),
        field('options.titleFontSize', 'Title size', 'number', 18, 'Title font size in CSS pixels.', { min: 8, max: 64 }),
        field('options.colors', 'Palette', 'json', undefined, 'Nonempty array of CSS colors.'),
        field('options.background', 'Background', 'color', '#ffffff', 'Canvas background color.'),
        field('options.textColor', 'Text color', 'color', '#485653', 'Default text color.'),
        field('options.fontFamily', 'Font family', 'text', 'sans-serif', 'A font already available in the browser.'),
        field('options.fontSize', 'Text size', 'number', 12, 'Canvas text size in CSS pixels.', { min: 8, max: 32 }),
        field('options.pixelRatio', 'Pixel ratio', 'number', '', 'Defaults to device ratio; React caps the value at 1..4.', { min: 1, max: 4, step: 0.5 }),
        field('options.emptyText', 'Empty state', 'text', 'No data', 'Text when no visible series contains points.')
    ] },
    { title: 'Margins and grid', fields: [
        ...['top', 'right', 'bottom', 'left'].map(side => field(`options.margin.${side}`, `${side} margin`, 'number', '', 'Plot margin in CSS pixels.', { min: 0, max: 160 })),
        field('options.grid.visible', 'Grid visible', 'boolean', true, 'Cartesian grid and radial rings.'),
        field('options.grid.color', 'Grid color', 'color', '#e5e9e9', 'Grid-line color.'),
        field('options.grid.dash', 'Grid dash', 'json', [], 'Canvas dash-length array, for example [4, 3].')
    ] },
    { title: 'X axis', fields: axisFields('xAxis') },
    { title: 'Y axis', fields: axisFields('yAxis') },
    { title: 'Series and line styling', fields: [
        field('series.id', 'Series ID', 'text', 'primary', 'Unique stable ID used by hiddenSeries and legend toggles.'),
        field('series.name', 'Series name', 'text', 'Observed', 'Legend and tooltip label.'),
        field('series.type', 'Series type', 'select', '', 'Overrides chart type for this series; incompatible families cannot mix.', { choices: ['', ...chartTypes] }),
        field('series.data', 'Custom data', 'json', undefined, 'Replace the first series with a JSON array or column object. Leave unchanged to retain generated data.'),
        field('series.visible', 'Series visible', 'boolean', true, 'False hides the series and disables its legend toggle.'),
        field('series.color', 'Series color', 'color', '#087f75', 'Overrides the palette; object-point color takes precedence.'),
        field('series.lineWidth', 'Line width', 'number', 2, 'Cartesian strokes, radar lines, or gauge thickness.', { min: 0, max: 40, step: 0.5 }),
        field('series.opacity', 'Opacity', 'number', 1, 'Overall Cartesian/radial series alpha.', { min: 0, max: 1, step: 0.05 }),
        field('series.dash', 'Line dash', 'json', [], 'Cartesian stroke dash-length array.'),
        field('series.markers', 'Path markers', 'boolean', false, 'Show markers on line, spline, step, and area.'),
        field('series.markerRadius', 'Marker radius', 'number', 3, 'Path/scatter marker radius in CSS pixels.', { min: 0, max: 20 }),
        field('series.connectNulls', 'Connect nulls', 'boolean', false, 'Join valid XY vertices across missing values.'),
        field('series.fillOpacity', 'Fill opacity', 'number', 0.2, 'Area, stacked/range area, or radar fill alpha.', { min: 0, max: 1, step: 0.05 }),
        field('series.baseline', 'Area baseline', 'number', 0, 'Area fill baseline, clipped to the y domain.')
    ] },
    { title: 'Specialized series options', fields: [
        field('series.maxBubbleRadius', 'Maximum bubble radius', 'number', 40, 'Bubble radius cap in pixels.', { min: 1, max: 100 }),
        field('series.barWidth', 'Maximum bar width', 'number', 36, 'Bar/category pixel-width cap.', { min: 1, max: 100 }),
        field('series.borderWidth', 'Sector border width', 'number', 2, 'Pie/donut sector separator thickness.', { min: 0, max: 12 }),
        field('series.innerRadius', 'Donut inner radius', 'number', 0.6, 'Fraction of outer radius; capped at 0.95.', { min: 0, max: 0.95, step: 0.05 }),
        field('series.bins', 'Histogram bins', 'number', 20, 'Integer from 1 to 10000; maxItems also applies to bins.', { min: 1, max: 2000 }),
        field('series.upColor', 'Rising financial color', 'color', '#087f75', 'Candlestick/OHLC close greater than or equal to open.'),
        field('series.downColor', 'Falling financial color', 'color', '#db5b39', 'Candlestick/OHLC close below open.'),
        field('series.cellWidth', 'Heatmap cell width', 'number', 1, 'Heatmap width in x-axis units.', { min: 0.1, step: 0.1 }),
        field('series.cellHeight', 'Heatmap cell height', 'number', 1, 'Heatmap height in y-axis units.', { min: 0.1, step: 0.1 }),
        field('series.colorMin', 'Heatmap intensity minimum', 'number', 0, 'Lower end of the alpha intensity scale.'),
        field('series.colorMax', 'Heatmap intensity maximum', 'number', 100, 'Upper end of the alpha intensity scale.')
    ] },
    { title: 'Labels, tooltip, and legend', fields: [
        field('options.dataLabels.enabled', 'Data labels', 'boolean', false, 'Detailed/radial labels; dense XY paths omit labels.'),
        field('options.dataLabels.color', 'Label color', 'color', '#243d36', 'Data label text color.'),
        field('options.dataLabels.formatter', 'Data label formatter', 'function', undefined, 'Function (point, series) => string.', { presets: 'label' }),
        field('options.tooltip.enabled', 'Tooltip', 'boolean', true, 'React tooltip overlay.'),
        field('options.tooltip.hitRadius', 'Tooltip hit radius', 'number', 24, 'Nearest-point tolerance in CSS pixels.', { min: 0, max: 100 }),
        field('options.tooltip.formatter', 'Tooltip formatter', 'function', undefined, 'Function (hit) => plain text; no HTML injection.', { presets: 'tooltip' }),
        field('options.tooltip.style', 'Tooltip style', 'json', undefined, 'React inline-style object; camelCase CSS keys.'),
        field('options.legend.enabled', 'Legend', 'boolean', true, 'React series-toggle buttons.'),
        field('options.legend.align', 'Legend alignment', 'select', 'center', 'Horizontal alignment.', { choices: ['start', 'center', 'end'] }),
        field('options.legend.style', 'Legend style', 'json', undefined, 'React inline-style object.'),
        field('options.hiddenSeries', 'Hidden series IDs', 'json', [], 'IDs forced hidden, for example ["primary"].')
    ] },
    { title: 'Interaction and performance', fields: [
        field('options.zoom.enabled', 'X zoom', 'boolean', false, 'Wheel/keyboard zoom for vertical Cartesian charts.'),
        field('options.zoom.pan', 'Pointer panning', 'boolean', true, 'Horizontal drag-to-pan when zoom is enabled.'),
        field('options.zoom.minSpan', 'Minimum x span', 'number', '', 'Minimum viewport width in x-axis units.', { min: 0 }),
        field('options.crosshair.enabled', 'Crosshair', 'boolean', false, 'Vertical pointer overlay when a hit is found.'),
        field('options.crosshair.color', 'Crosshair color', 'color', '#718780', 'Vertical crosshair stroke.'),
        field('options.performance.maxPoints', 'Dense draw budget', 'number', 1800, 'Min/max sample budget per dense XY series, at least 4.', { min: 4, max: 20000 }),
        field('options.performance.maxItems', 'Detailed item limit', 'number', 2000, 'Reject detailed inputs above this limit rather than silently sample.', { min: 1, max: 100000 })
    ] },
    { title: 'Accessibility and drawing hooks', fields: [
        field('options.accessibility.label', 'Accessible label', 'text', 'Chart', 'Accessible name for the figure and canvas.'),
        field('options.accessibility.description', 'Accessible description', 'text', '', 'Screen-reader chart summary.'),
        field('options.accessibility.table', 'Accessible table', 'boolean', false, 'Include a visually hidden, bounded data table.'),
        field('options.accessibility.maxRows', 'Accessible rows per series', 'number', 50, 'Table rows per series, capped at 1000.', { min: 0, max: 1000 }),
        field('options.hooks.beforeDraw', 'Before-draw hook', 'function', undefined, 'Canvas hook (context, frame); keep save/restore balanced.', { presets: 'hook' }),
        field('options.hooks.afterDraw', 'After-draw hook', 'function', undefined, 'Canvas overlay hook (context, frame).', { presets: 'hook' })
    ] },
    { title: 'React component props', fields: [
        field('props.width', 'Width', 'text', '100%', 'CSS width or numeric pixels; constrained by available space.'),
        field('props.height', 'Height', 'number', 380, 'Chart canvas height in CSS pixels.', { min: 160, max: 900 }),
        field('props.className', 'Class name', 'text', '', 'Outer figure class.'),
        field('props.style', 'Figure style', 'json', undefined, 'React style object for the outer figure; not painted canvas pixels.'),
        field('props.dataVersion', 'Data version', 'number', 0, 'Triggers redraw; in-place buffer changes also require invalidateData(data).')
    ] }
];

export const apiReference = [
    ['series', 'Required array of Series objects. The playground edits the first series.'],
    ['options', 'ChartOptions object. All supported fields are listed in the reference below.'],
    ['onPointClick(hit, event)', 'Called when a rendered point or shape is selected.'],
    ['onHover(hit | null)', 'Called on pointer hover and when leaving the chart.'],
    ['onViewportChange(range | null)', 'Receives { min, max } on zoom/pan, or null on reset.'],
    ['onError(error)', 'Receives rendering failures; the chart also displays an inline error state.'],
    ['getCanvas()', 'Ref method returning the canvas or null before mount.'],
    ['getFrame()', 'Ref method returning the last frame, scales, and hit targets.'],
    ['resetZoom()', 'Ref method that restores the complete x domain.'],
    ['setViewport(min, max)', 'Ref method that sets a bounded x viewport.'],
    ['redraw()', 'Ref method that schedules drawing without invalidating data indexes.'],
    ['exportImage(type?, quality?)', 'Ref method returning a data URL; defaults to image/png. HTML overlays are excluded.']
];

export const pointReference = [
    ['x', 'Numeric coordinate; defaults to point index. Time uses epoch milliseconds.'],
    ['y', 'Required numeric value or null. Use close/median/midpoint as representative y for specialized charts.'],
    ['label', 'Object-point category or tooltip label.'],
    ['color', 'Object-point CSS color override.'],
    ['size', 'Bubble magnitude; radius is its square root.'],
    ['value', 'Heatmap intensity.'],
    ['low', 'Financial/range lower bound or boxplot lower whisker.'],
    ['high', 'Upper bound/whisker, or bullet target.'],
    ['open', 'Financial opening value.'],
    ['close', 'Financial closing value.'],
    ['q1', 'Boxplot lower quartile.'],
    ['q3', 'Boxplot upper quartile.'],
    ['median', 'Boxplot median.'],
    ['total', 'Waterfall total/reset flag.']
];