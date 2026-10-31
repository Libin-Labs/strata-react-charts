import { createDataIndex, hasGap, histogram, pointAt, sampleIndices } from './data.js';
export const chartTypes = Object.freeze(['line', 'spline', 'step', 'area', 'stackedArea', 'column', 'bar', 'stackedColumn', 'stackedBar', 'scatter', 'bubble', 'pie', 'donut', 'polar', 'radar', 'heatmap', 'treemap', 'candlestick', 'ohlc', 'rangeArea', 'rangeBar', 'histogram', 'boxplot', 'waterfall', 'funnel', 'pyramid', 'gauge', 'bullet']);
export const defaultColors = Object.freeze(['#087f75', '#db5b39', '#4463ad', '#b48a19', '#a44879', '#49874a', '#7357a3', '#237f9c']);
const radialTypes = new Set(['pie', 'donut', 'polar', 'radar', 'gauge']);
const partitionTypes = new Set(['treemap', 'funnel', 'pyramid']);
const denseTypes = new Set(['line', 'spline', 'step', 'area', 'scatter', 'bubble']);
const histograms = new WeakMap();
const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2, notation: 'compact' });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function expanded(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max))
        return [0, 1];
    if (min === max) {
        const delta = Math.abs(min) * 0.05 || 1;
        return [min - delta, max + delta];
    }
    return [min, max];
}
function domain(min, max, axis = {}) {
    const result = expanded(min, max);
    const lower = axis.min ?? result[0];
    const upper = axis.max ?? result[1];
    if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower >= upper)
        throw new RangeError('Axis min must be finite and less than max.');
    return [lower, upper];
}
function scale(source, start, end) {
    const convert = value => start + (value - source[0]) / (source[1] - source[0]) * (end - start);
    convert.invert = value => source[0] + (value - start) / (end - start) * (source[1] - source[0]);
    return convert;
}
function line(context, x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}
function label(context, text, x, y, align = 'center') {
    context.textAlign = align;
    context.fillText(String(text), x, y);
}
function colorFor(entry, point, index, options) {
    return point?.color ?? entry.series.color ?? (options.colors ?? defaultColors)[index % (options.colors ?? defaultColors).length];
}
function addHit(frame, entry, index, x, y, extra = {}) {
    frame.hits.push({ series: entry.series, seriesIndex: entry.originalIndex, index, point: pointAt(entry.data, index), x, y, ...extra });
}
function dot(context, x, y, radius) {
    context.beginPath();
    context.arc(x, y, Math.max(0, radius), 0, Math.PI * 2);
    context.fill();
}
function fillRect(context, x, y, width, height) {
    context.fillRect(Math.min(x, x + width), Math.min(y, y + height), Math.max(1, Math.abs(width)), Math.max(1, Math.abs(height)));
}
function formatTick(axis, value) {
    if (axis.formatter)
        return axis.formatter(value);
    if (axis.categories)
        return axis.categories[Math.round(value)] ?? '';
    if (axis.type === 'time')
        return new Date(value).toISOString().slice(0, 10);
    return formatter.format(value);
}
function drawTick(context, plot, axis, options, vertical, value, ratio) {
    const position = vertical ? plot.bottom - ratio * plot.height : plot.left + ratio * plot.width;
    context.strokeStyle = options.grid?.color ?? '#e5e9e9';
    context.setLineDash(options.grid?.dash ?? []);
    if (options.grid?.visible !== false) {
        if (vertical)
            line(context, plot.left, position, plot.right, position);
        else
            line(context, position, plot.top, position, plot.bottom);
    }
    context.fillStyle = axis.color ?? options.textColor ?? '#485653';
    const text = formatTick(axis, value);
    if (vertical)
        label(context, text, plot.left - 10, position + 4, 'right');
    else
        label(context, text, position, plot.bottom + 22);
}
function drawAxisTitle(context, plot, axis, vertical) {
    if (!axis.title)
        return;
    if (!vertical) {
        label(context, axis.title, plot.left + plot.width / 2, plot.bottom + 43);
        return;
    }
    context.save();
    context.translate(16, plot.top + plot.height / 2);
    context.rotate(-Math.PI / 2);
    label(context, axis.title, 0, 0);
    context.restore();
}
function drawAxes(context, frame, options, horizontal) {
    context.lineWidth = 1;
    const axes = [options.xAxis ?? {}, options.yAxis ?? {}];
    axes.forEach((axis, axisIndex) => {
        if (axis.visible === false)
            return;
        const vertical = horizontal ? axisIndex === 0 : axisIndex === 1;
        const values = axisIndex === 0 ? frame.xDomain : frame.yDomain;
        const count = clamp(Math.floor(axis.tickCount ?? 5), 2, 20);
        for (let tick = 0; tick <= count; tick++) {
            const ratio = tick / count;
            drawTick(context, frame.plot, axis, options, vertical, values[0] + ratio * (values[1] - values[0]), ratio);
        }
        drawAxisTitle(context, frame.plot, axis, vertical);
    });
    context.setLineDash([]);
}
function sampledSegments(entry, frame, budget) {
    const indices = sampleIndices(entry.data, { min: frame.xDomain[0], max: frame.xDomain[1], budget });
    const segments = [];
    let segment = [];
    let previousIndex = -1;
    for (const index of indices) {
        const point = pointAt(entry.data, index);
        const valid = Number.isFinite(point.x) && Number.isFinite(point.y);
        const broken = previousIndex >= 0 && hasGap(entry.index, previousIndex, index);
        if (!entry.series.connectNulls && (!valid || broken)) {
            if (segment.length)
                segments.push(segment);
            segment = [];
        }
        if (valid) {
            const x = frame.x(point.x);
            const y = frame.y(point.y);
            segment.push({ x, y, point });
            addHit(frame, entry, index, x, y);
        }
        previousIndex = index;
    }
    if (segment.length)
        segments.push(segment);
    return segments;
}
function traceSegment(context, points, type) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let position = 1; position < points.length; position++) {
        const current = points[position];
        const previous = points[position - 1];
        if (type === 'step')
            context.lineTo(current.x, previous.y);
        if (type === 'spline') {
            const middle = (previous.x + current.x) / 2;
            context.bezierCurveTo(middle, previous.y, middle, current.y, current.x, current.y);
        }
        else
            context.lineTo(current.x, current.y);
    }
    context.stroke();
}
function drawMarkers(context, points, entry) {
    for (const { x, y, point } of points) {
        context.fillStyle = point.color ?? entry.color;
        const radius = entry.type === 'bubble'
            ? clamp(Math.sqrt(Math.max(0, point.size ?? 16)), 1, entry.series.maxBubbleRadius ?? 40)
            : (entry.series.markerRadius ?? 3);
        dot(context, x, y, radius);
    }
}
function drawPath(context, entry, frame, options) {
    const budget = Math.max(4, Math.floor(options.performance?.maxPoints ?? frame.plot.width * 2));
    for (const points of sampledSegments(entry, frame, budget)) {
        if (entry.type === 'scatter' || entry.type === 'bubble') {
            drawMarkers(context, points, entry);
            continue;
        }
        traceSegment(context, points, entry.type);
        if (entry.type === 'area') {
            const baseline = frame.y(clamp(entry.series.baseline ?? 0, ...frame.yDomain));
            context.lineTo(points.at(-1).x, baseline);
            context.lineTo(points[0].x, baseline);
            context.closePath();
            context.save();
            context.globalAlpha *= entry.series.fillOpacity ?? 0.2;
            context.fill();
            context.restore();
        }
        if (entry.series.markers)
            drawMarkers(context, points, entry);
    }
}
const horizontalTypes = new Set(['bar', 'stackedBar', 'bullet']);
const groupedTypes = new Set(['column', 'bar', 'histogram', 'bullet']);
function barRectangle(geometry, from, to, width = geometry.band, offset = 0) {
    const { categoryScale, valueScale, point } = geometry;
    const category = categoryScale(point.x) + offset;
    if (geometry.horizontal)
        return { x: valueScale(from), y: category - width / 2, width: valueScale(to) - valueScale(from), height: width };
    return { x: category - width / 2, y: valueScale(to), width, height: valueScale(from) - valueScale(to) };
}
function stackedGeometry(context, geometry, state) {
    const { entry, point, frame } = geometry;
    const key = stackKey(entry.type, point);
    const from = state.stacks.get(key) ?? 0;
    const to = from + point.y;
    state.stacks.set(key, to);
    geometry.endpoint = to;
    if (entry.type === 'stackedArea') {
        state.top.push([frame.x(point.x), frame.y(to)]);
        state.bottom.push([frame.x(point.x), frame.y(from)]);
        return null;
    }
    return barRectangle(geometry, from, to);
}
function groupedGeometry(context, geometry, state) {
    const { entry, point, options, valueScale, categoryScale } = geometry;
    const count = Math.max(1, state.barEntries.length);
    const width = geometry.band / count;
    const offset = (state.barEntries.indexOf(entry) - (count - 1) / 2) * width;
    if (entry.type === 'bullet' && Number.isFinite(point.high)) {
        const category = categoryScale(point.x) + offset;
        context.strokeStyle = options.textColor ?? '#263d37';
        context.lineWidth = 3;
        line(context, valueScale(point.high), category - width, valueScale(point.high), category + width);
    }
    return barRectangle(geometry, clamp(0, ...geometry.frame.yDomain), point.y, width, offset);
}
function waterfallGeometry(context, geometry, state) {
    const { point } = geometry;
    const from = point.total ? 0 : state.running;
    const to = point.total ? point.y : state.running + point.y;
    state.running = to;
    geometry.endpoint = to;
    return barRectangle(geometry, from, to);
}
function rangeGeometry(context, geometry, state) {
    const { point, entry, frame } = geometry;
    if (!Number.isFinite(point.low) || !Number.isFinite(point.high))
        return null;
    if (entry.type === 'rangeArea') {
        state.top.push([frame.x(point.x), frame.y(point.high)]);
        state.bottom.push([frame.x(point.x), frame.y(point.low)]);
        return null;
    }
    return barRectangle(geometry, point.low, point.high);
}
function financialColor(entry, point) {
    if (entry.type === 'boxplot')
        return point.color ?? entry.color;
    return point.close >= point.open ? (entry.series.upColor ?? '#087f75') : (entry.series.downColor ?? '#db5b39');
}
function drawFinancialBody(context, geometry, open, close) {
    if (!Number.isFinite(open) || !Number.isFinite(close))
        return;
    const { entry, frame, point, band } = geometry;
    const x = frame.x(point.x);
    if (entry.type === 'ohlc') {
        line(context, x - band / 2, frame.y(open), x, frame.y(open));
        line(context, x, frame.y(close), x + band / 2, frame.y(close));
    }
    else
        fillRect(context, x - band / 2, frame.y(close), band, frame.y(open) - frame.y(close));
}
function financialGeometry(context, geometry) {
    const { entry, frame, point, band, options } = geometry;
    if (!Number.isFinite(point.low) || !Number.isFinite(point.high))
        return;
    const x = frame.x(point.x);
    const box = entry.type === 'boxplot';
    context.strokeStyle = context.fillStyle = financialColor(entry, point);
    line(context, x, frame.y(point.low), x, frame.y(point.high));
    drawFinancialBody(context, geometry, box ? point.q1 : point.open, box ? point.q3 : point.close);
    if (box) {
        line(context, x - band / 3, frame.y(point.low), x + band / 3, frame.y(point.low));
        line(context, x - band / 3, frame.y(point.high), x + band / 3, frame.y(point.high));
        if (Number.isFinite(point.median)) {
            context.strokeStyle = options.background ?? '#ffffff';
            line(context, x - band / 2, frame.y(point.median), x + band / 2, frame.y(point.median));
        }
    }
}
function heatmapGeometry(context, geometry) {
    const { entry, frame, point } = geometry;
    const x = frame.x(point.x);
    const y = frame.y(point.y);
    const width = Math.abs(frame.x(point.x + (entry.series.cellWidth ?? 1)) - x);
    const height = Math.abs(frame.y(point.y + (entry.series.cellHeight ?? 1)) - y);
    const minimum = entry.series.colorMin ?? 0;
    const span = (entry.series.colorMax ?? 100) - minimum || 1;
    const intensity = clamp(((point.value ?? point.y) - minimum) / span, 0, 1);
    context.globalAlpha = (entry.series.opacity ?? 1) * (0.12 + intensity * 0.88);
    return { x: x - width / 2, y: y - height / 2, width, height };
}
const geometryDrawers = {
    stackedArea: stackedGeometry, stackedColumn: stackedGeometry, stackedBar: stackedGeometry,
    column: groupedGeometry, bar: groupedGeometry, histogram: groupedGeometry, bullet: groupedGeometry,
    waterfall: waterfallGeometry, rangeArea: rangeGeometry, rangeBar: rangeGeometry,
    candlestick: financialGeometry, ohlc: financialGeometry, boxplot: financialGeometry, heatmap: heatmapGeometry
};
function drawBand(context, top, bottom, opacity) {
    if (!top.length)
        return;
    context.beginPath();
    context.moveTo(...top[0]);
    for (const coordinate of top.slice(1))
        context.lineTo(...coordinate);
    for (let index = bottom.length - 1; index >= 0; index--)
        context.lineTo(...bottom[index]);
    context.closePath();
    context.save();
    context.globalAlpha *= opacity;
    context.fill();
    context.stroke();
    context.restore();
}
function drawDetailedPoint(context, geometry, state, index) {
    const { entry, point, frame, options, horizontal, categoryScale, valueScale } = geometry;
    context.fillStyle = point.color ?? entry.color;
    const rect = geometryDrawers[entry.type](context, geometry, state);
    let bounds;
    if (rect) {
        fillRect(context, rect.x, rect.y, rect.width, rect.height);
        bounds = { x: Math.min(rect.x, rect.x + rect.width), y: Math.min(rect.y, rect.y + rect.height), width: Math.abs(rect.width), height: Math.abs(rect.height) };
    }
    const x = horizontal ? valueScale(geometry.endpoint) : frame.x(point.x);
    const y = horizontal ? categoryScale(point.x) : frame.y(geometry.endpoint);
    addHit(frame, entry, index, x, y, bounds ? { rect: bounds } : {});
    if (options.dataLabels?.enabled) {
        context.fillStyle = options.dataLabels.color ?? options.textColor ?? '#243d36';
        label(context, options.dataLabels.formatter?.(point, entry.series) ?? formatter.format(point.y), x, y - 7);
    }
}
function drawDetailedSeries(context, entry, frame, options, state) {
    const horizontal = horizontalTypes.has(entry.type);
    const categoryScale = horizontal ? frame.categoryY : frame.x;
    const valueScale = horizontal ? frame.valueX : frame.y;
    const available = horizontal ? frame.plot.height : frame.plot.width;
    const band = Math.max(1, Math.min(entry.series.barWidth ?? 36, available / Math.max(1, entry.index.length) * 0.7));
    for (let index = 0; index < entry.index.length; index++) {
        const point = pointAt(entry.data, index);
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
            continue;
        const geometry = { entry, frame, options, point, horizontal, categoryScale, valueScale, band, endpoint: point.y };
        drawDetailedPoint(context, geometry, state, index);
    }
    drawBand(context, state.top, state.bottom, entry.series.fillOpacity ?? 0.35);
}
function drawCartesian(context, entries, frame, options) {
    const stacks = new Map();
    const barEntries = entries.filter(entry => groupedTypes.has(entry.type));
    for (const entry of entries) {
        context.strokeStyle = context.fillStyle = entry.color;
        context.lineWidth = entry.series.lineWidth ?? 2;
        context.globalAlpha = entry.series.opacity ?? 1;
        context.setLineDash(entry.series.dash ?? []);
        if (denseTypes.has(entry.type))
            drawPath(context, entry, frame, options);
        else
            drawDetailedSeries(context, entry, frame, options, { stacks, barEntries, running: 0, top: [], bottom: [] });
    }
    context.globalAlpha = 1;
    context.setLineDash([]);
}
function stackKey(type, point) {
    return `${type}:${point.x}:${point.y >= 0 ? 'positive' : 'negative'}`;
}
function drawGauge(context, entry, frame, options, circle) {
    if (!entry.index.length)
        return;
    const point = pointAt(entry.data, 0);
    if (!Number.isFinite(point.y))
        return;
    const [min, max] = domain(0, 100, options.yAxis);
    const ratio = clamp((point.y - min) / (max - min), 0, 1);
    const { centerX, centerY, radius } = circle;
    context.lineWidth = entry.series.lineWidth ?? Math.max(8, radius * 0.16);
    context.strokeStyle = options.grid?.color ?? '#e5e9e9';
    context.beginPath();
    context.arc(centerX, centerY + radius * 0.25, radius * 0.8, Math.PI, Math.PI * 2);
    context.stroke();
    context.strokeStyle = entry.color;
    context.beginPath();
    context.arc(centerX, centerY + radius * 0.25, radius * 0.8, Math.PI, Math.PI + Math.PI * ratio);
    context.stroke();
    context.fillStyle = options.textColor ?? '#243d36';
    context.font = `600 30px ${options.fontFamily ?? 'sans-serif'}`;
    label(context, options.dataLabels?.formatter?.(point, entry.series) ?? formatter.format(point.y), centerX, centerY + radius * 0.2);
    addHit(frame, entry, 0, centerX, centerY);
}
function radialLabel(context, point, index, theta, circle, options) {
    if (!options.dataLabels?.enabled)
        return;
    context.fillStyle = options.dataLabels.color ?? options.textColor ?? '#243d36';
    label(context, point.label ?? index, circle.centerX + Math.cos(theta) * (circle.radius + 12), circle.centerY + Math.sin(theta) * (circle.radius + 12));
}
function drawRadialGrid(context, circle, options) {
    if (options.grid?.visible === false)
        return;
    context.strokeStyle = options.grid?.color ?? '#e5e9e9';
    context.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring++) {
        context.beginPath();
        context.arc(circle.centerX, circle.centerY, circle.radius * ring / 4, 0, Math.PI * 2);
        context.stroke();
    }
}
function drawPolarSector(context, entry, point, index, circle, vertex, options) {
    context.beginPath();
    context.moveTo(circle.centerX, circle.centerY);
    context.arc(circle.centerX, circle.centerY, vertex.distance, vertex.theta, vertex.theta + Math.PI * 2 / entry.index.length * 0.9);
    context.closePath();
    context.fillStyle = colorFor(entry, point, index, options);
    context.fill();
}
function drawRadar(context, entry, frame, options, circle, radialDomain) {
    context.strokeStyle = context.fillStyle = entry.color;
    context.lineWidth = entry.series.lineWidth ?? 2;
    context.beginPath();
    let started = false;
    for (let index = 0; index < entry.index.length; index++) {
        const point = pointAt(entry.data, index);
        if (!Number.isFinite(point.y))
            continue;
        const theta = -Math.PI / 2 + index / entry.index.length * Math.PI * 2;
        const distance = circle.radius * clamp((point.y - radialDomain[0]) / (radialDomain[1] - radialDomain[0]), 0, 1);
        const x = circle.centerX + Math.cos(theta) * distance;
        const y = circle.centerY + Math.sin(theta) * distance;
        if (entry.type === 'polar')
            drawPolarSector(context, entry, point, index, circle, { theta, distance }, options);
        else if (!started)
            context.moveTo(x, y);
        else
            context.lineTo(x, y);
        started = true;
        addHit(frame, entry, index, x, y);
        radialLabel(context, point, index, theta, circle, options);
        context.fillStyle = entry.color;
    }
    if (entry.type !== 'radar' || !started)
        return;
    context.closePath();
    context.stroke();
    context.save();
    context.globalAlpha *= entry.series.fillOpacity ?? 0.15;
    context.fill();
    context.restore();
}
function drawPieSector(context, entry, point, index, frame, options, sector) {
    const { centerX, centerY, radius, inner, start, end } = sector;
    context.fillStyle = colorFor(entry, point, index, options);
    context.beginPath();
    context.arc(centerX, centerY, radius, start, end);
    if (inner)
        context.arc(centerX, centerY, inner, end, start, true);
    else
        context.lineTo(centerX, centerY);
    context.closePath();
    context.fill();
    context.strokeStyle = options.background ?? '#ffffff';
    context.lineWidth = entry.series.borderWidth ?? 2;
    context.stroke();
    const middle = (start + end) / 2;
    const x = centerX + Math.cos(middle) * (radius + inner) / 2;
    const y = centerY + Math.sin(middle) * (radius + inner) / 2;
    addHit(frame, entry, index, x, y, { sector });
    if (options.dataLabels?.enabled && end - start > 0.15) {
        context.fillStyle = options.dataLabels.color ?? '#ffffff';
        label(context, options.dataLabels.formatter?.(point, entry.series) ?? point.label ?? formatter.format(point.y), x, y);
    }
}
function drawPie(context, entry, frame, options, circle) {
    const points = Array.from({ length: entry.index.length }, (_, index) => pointAt(entry.data, index));
    const positive = point => Number.isFinite(point.y) && point.y > 0;
    const total = points.filter(positive).reduce((sum, point) => sum + point.y, 0);
    if (!total)
        return;
    const inner = entry.type === 'donut' ? circle.radius * clamp(entry.series.innerRadius ?? 0.6, 0, 0.95) : 0;
    let angle = -Math.PI / 2;
    points.forEach((point, index) => {
        if (!positive(point))
            return;
        const sweep = point.y / total * Math.PI * 2;
        drawPieSector(context, entry, point, index, frame, options, { ...circle, inner, start: angle, end: angle + sweep });
        angle += sweep;
    });
}
function drawRadial(context, entries, frame, options) {
    const { plot } = frame;
    const circle = { centerX: plot.left + plot.width / 2, centerY: plot.top + plot.height / 2, radius: Math.max(1, Math.min(plot.width, plot.height) / 2 - 18) };
    const type = entries[0]?.type;
    const radar = type === 'radar' || type === 'polar';
    const radialDomain = domain(0, Math.max(1, ...entries.map(entry => entry.index.yMax)), options.yAxis);
    if (radar)
        drawRadialGrid(context, circle, options);
    for (const entry of entries) {
        context.save();
        context.globalAlpha = entry.series.opacity ?? 1;
        if (entry.type === 'gauge')
            drawGauge(context, entry, frame, options, circle);
        else if (radar)
            drawRadar(context, entry, frame, options, circle, radialDomain);
        else
            drawPie(context, entry, frame, options, circle);
        context.restore();
    }
}
function drawPartitions(context, entry, frame, options) {
    if (!entry)
        return;
    const { plot } = frame;
    const points = Array.from({ length: entry.index.length }, (_, index) => ({ ...pointAt(entry.data, index), index })).filter(point => Number.isFinite(point.y) && point.y > 0);
    const total = points.reduce((sum, point) => sum + point.y, 0);
    const max = Math.max(1, ...points.map(point => point.y));
    let remaining = total;
    let rect = { x: plot.left, y: plot.top, width: plot.width, height: plot.height };
    points.forEach((point, position) => {
        context.fillStyle = colorFor(entry, point, point.index, options);
        let hitRect;
        if (entry.type === 'treemap') {
            const vertical = rect.width >= rect.height;
            const ratio = point.y / remaining;
            hitRect = { x: rect.x, y: rect.y, width: vertical ? rect.width * ratio : rect.width, height: vertical ? rect.height : rect.height * ratio };
            fillRect(context, hitRect.x + 1, hitRect.y + 1, Math.max(0, hitRect.width - 2), Math.max(0, hitRect.height - 2));
            if (vertical)
                rect = { ...rect, x: rect.x + hitRect.width, width: rect.width - hitRect.width };
            else
                rect = { ...rect, y: rect.y + hitRect.height, height: rect.height - hitRect.height };
            remaining -= point.y;
        }
        else {
            const height = plot.height * point.y / total;
            const topRatio = entry.type === 'pyramid' ? (rect.y - plot.top) / plot.height : point.y / max;
            const bottomRatio = entry.type === 'pyramid' ? (rect.y + height - plot.top) / plot.height : (points[position + 1]?.y ?? point.y * 0.5) / max;
            const center = plot.left + plot.width / 2;
            context.beginPath();
            context.moveTo(center - plot.width * topRatio / 2, rect.y);
            context.lineTo(center + plot.width * topRatio / 2, rect.y);
            context.lineTo(center + plot.width * bottomRatio / 2, rect.y + height);
            context.lineTo(center - plot.width * bottomRatio / 2, rect.y + height);
            context.closePath();
            context.fill();
            hitRect = { x: center - plot.width * Math.max(topRatio, bottomRatio) / 2, y: rect.y, width: plot.width * Math.max(topRatio, bottomRatio), height };
            rect.y += height;
        }
        const x = hitRect.x + hitRect.width / 2;
        const y = hitRect.y + hitRect.height / 2;
        addHit(frame, entry, point.index, x, y, { rect: hitRect });
        if (options.dataLabels?.enabled && hitRect.width > 40 && hitRect.height > 20) {
            context.save();
            context.beginPath();
            context.rect(hitRect.x, hitRect.y, hitRect.width, hitRect.height);
            context.clip();
            context.fillStyle = options.dataLabels.color ?? '#ffffff';
            label(context, options.dataLabels.formatter?.(point, entry.series) ?? point.label ?? formatter.format(point.y), x, y + 4);
            context.restore();
        }
    });
}
function prepare(series, options) {
    const palette = options.colors ?? defaultColors;
    if (!palette.length)
        throw new RangeError('colors must not be empty.');
    return series.map((item, originalIndex) => {
        const type = item.type ?? options.type ?? 'line';
        if (!chartTypes.includes(type))
            throw new TypeError(`Unsupported chart type: ${type}`);
        let data = item.data;
        if (type === 'histogram') {
            const bins = item.bins ?? 20;
            let cached = histograms.get(data);
            const sourceIndex = createDataIndex(data);
            if (!cached || cached.bins !== bins || cached.sourceIndex !== sourceIndex) {
                cached = { bins, sourceIndex, data: histogram(data, bins) };
                histograms.set(data, cached);
            }
            data = cached.data;
        }
        const index = createDataIndex(data);
        if (!denseTypes.has(type) && index.length > (options.performance?.maxItems ?? 2000))
            throw new RangeError(`${type} exceeds maxItems. Aggregate data or explicitly raise performance.maxItems.`);
        return { series: item, originalIndex, type, data, index, color: item.color ?? palette[originalIndex % palette.length] };
    }).filter(entry => entry.series.visible !== false && !options.hiddenSeries?.includes(entry.series.id ?? String(entry.originalIndex)));
}
export function renderChart(context, { width, height, series = [], options = {}, pixelRatio = 1 }) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
        throw new RangeError('Chart dimensions must be positive finite numbers.');
    if (!Number.isFinite(pixelRatio) || pixelRatio <= 0)
        throw new RangeError('pixelRatio must be positive and finite.');
    const entries = prepare(series, options);
    const type = entries[0]?.type ?? options.type ?? 'line';
    validateFamilies(entries, type);
    const frame = createFrame(width, height, entries, options);
    context.save();
    try {
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);
        context.fillStyle = options.background ?? '#ffffff';
        context.fillRect(0, 0, width, height);
        context.font = `${options.fontSize ?? 12}px ${options.fontFamily ?? 'sans-serif'}`;
        context.lineJoin = 'round';
        drawTitle(context, frame.plot, options);
        options.hooks?.beforeDraw?.(context, frame);
        drawFrame(context, frame, type, options);
        if (!entries.some(entry => entry.index.length)) {
            context.fillStyle = options.textColor ?? '#485653';
            label(context, options.emptyText ?? 'No data', frame.plot.left + frame.plot.width / 2, frame.plot.top + frame.plot.height / 2);
        }
        options.hooks?.afterDraw?.(context, frame);
    }
    finally {
        context.restore();
    }
    return frame;
}
function validateFamilies(entries, type) {
    const special = radialTypes.has(type) || partitionTypes.has(type);
    if (special && entries.some(entry => entry.type !== type))
        throw new TypeError('Radial and partition types cannot be mixed.');
    if (!special && entries.some(entry => radialTypes.has(entry.type) || partitionTypes.has(entry.type)))
        throw new TypeError('Cartesian and radial or partition types cannot be mixed.');
    if (['pie', 'donut', 'gauge', 'treemap', 'funnel', 'pyramid'].includes(type) && entries.length > 1)
        throw new TypeError(`${type} accepts one series.`);
    if (!special && entries.some(entry => horizontalTypes.has(entry.type) !== horizontalTypes.has(type)))
        throw new TypeError('Horizontal and vertical Cartesian series cannot be mixed.');
}
function createPlot(width, height, type, options) {
    const margin = { top: options.title ? 56 : 20, right: 24, bottom: options.xAxis?.title ? 62 : 42, left: options.yAxis?.title ? 82 : 64, ...options.margin };
    if (radialTypes.has(type) || partitionTypes.has(type)) {
        margin.left = options.margin?.left ?? 20;
        margin.bottom = options.margin?.bottom ?? 20;
    }
    const plot = { left: margin.left, top: margin.top, width: Math.max(1, width - margin.left - margin.right), height: Math.max(1, height - margin.top - margin.bottom) };
    plot.right = plot.left + plot.width;
    plot.bottom = plot.top + plot.height;
    return plot;
}
function extendStackedDomain(entry, extents, stacked) {
    if (!entry.type.startsWith('stacked') && entry.type !== 'waterfall')
        return;
    let running = 0;
    for (let index = 0; index < entry.index.length; index++) {
        const point = pointAt(entry.data, index);
        if (!Number.isFinite(point.y))
            continue;
        if (entry.type === 'waterfall')
            running = point.total ? point.y : running + point.y;
        else {
            const key = stackKey(entry.type, point);
            running = (stacked.get(key) ?? 0) + point.y;
            stacked.set(key, running);
        }
        extents.yMin = Math.min(extents.yMin, running);
        extents.yMax = Math.max(extents.yMax, running);
    }
}
function extendDomain(entry, extents, stacked) {
    if (!entry.index.length)
        return;
    extents.xMin = Math.min(extents.xMin, entry.index.xMin);
    extents.xMax = Math.max(extents.xMax, entry.index.xMax);
    extents.yMin = Math.min(extents.yMin, entry.index.yMin);
    extents.yMax = Math.max(extents.yMax, entry.index.yMax);
    if (['column', 'bar', 'area', 'histogram', 'waterfall', 'bullet'].includes(entry.type) || entry.type.startsWith('stacked')) {
        extents.yMin = Math.min(0, extents.yMin);
        extents.yMax = Math.max(0, extents.yMax);
    }
    extendStackedDomain(entry, extents, stacked);
}
function createFrame(width, height, entries, options) {
    const type = entries[0]?.type ?? options.type ?? 'line';
    const plot = createPlot(width, height, type, options);
    const extents = { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity };
    const stacked = new Map();
    for (const entry of entries)
        extendDomain(entry, extents, stacked);
    const hasBands = entries.some(entry => !denseTypes.has(entry.type) && !['stackedArea', 'rangeArea'].includes(entry.type));
    if (hasBands && Number.isFinite(extents.xMin)) {
        const longest = Math.max(1, ...entries.map(entry => entry.index.length));
        const padding = (extents.xMax - extents.xMin) / Math.max(1, longest - 1) / 2 || 0.5;
        extents.xMin -= padding;
        extents.xMax += padding;
    }
    const xDomain = domain(extents.xMin, extents.xMax, options.xAxis);
    const yDomain = domain(extents.yMin, extents.yMax, options.yAxis);
    const frame = { width, height, plot, xDomain, yDomain, entries, hits: [],
        x: scale(xDomain, plot.left, plot.right), y: scale(yDomain, plot.bottom, plot.top),
        categoryY: scale(xDomain, plot.bottom, plot.top), valueX: scale(yDomain, plot.left, plot.right) };
    frame.hitTest = (x, y, radius = options.tooltip?.hitRadius ?? 24) => findHit(frame.hits, x, y, radius);
    return frame;
}
function containsSector(sector, x, y) {
    const distance = Math.hypot(x - sector.centerX, y - sector.centerY);
    let angle = Math.atan2(y - sector.centerY, x - sector.centerX);
    if (angle < -Math.PI / 2)
        angle += Math.PI * 2;
    return distance >= sector.inner && distance <= sector.radius && angle >= sector.start && angle <= sector.end;
}
function containsRectangle(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
function findHit(hits, x, y, radius) {
    let nearest = null;
    let distance = radius;
    for (const hit of hits) {
        if (hit.sector) {
            if (containsSector(hit.sector, x, y))
                return hit;
            continue;
        }
        if (hit.rect && containsRectangle(hit.rect, x, y))
            return hit;
        const current = Math.hypot(x - hit.x, y - hit.y);
        if (current <= distance) {
            distance = current;
            nearest = hit;
        }
    }
    return nearest;
}
function drawTitle(context, plot, options) {
    if (!options.title)
        return;
    context.fillStyle = options.textColor ?? '#243d36';
    context.font = `600 ${options.titleFontSize ?? 18}px ${options.fontFamily ?? 'sans-serif'}`;
    label(context, options.title, plot.left, 29, 'left');
    context.font = `${options.fontSize ?? 12}px ${options.fontFamily ?? 'sans-serif'}`;
}
function drawFrame(context, frame, type, options) {
    if (radialTypes.has(type)) {
        drawRadial(context, frame.entries, frame, options);
        return;
    }
    if (partitionTypes.has(type)) {
        drawPartitions(context, frame.entries[0], frame, options);
        return;
    }
    drawAxes(context, frame, options, horizontalTypes.has(type));
    context.save();
    try {
        context.beginPath();
        context.rect(frame.plot.left, frame.plot.top, frame.plot.width, frame.plot.height);
        context.clip();
        drawCartesian(context, frame.entries, frame, options);
    }
    finally {
        context.restore();
    }
}
