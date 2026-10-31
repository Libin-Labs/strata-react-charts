import { createElement, forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { renderChart, defaultColors } from './renderer.js';
import { dataLength, pointAt } from './data.js';
const emptyOptions = Object.freeze({});
const emptySeries = Object.freeze([]);
const visuallyHidden = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };
const interactiveTypes = new Set(['line', 'spline', 'step', 'area', 'scatter', 'bubble', 'column', 'stackedColumn', 'stackedArea', 'candlestick', 'ohlc', 'rangeArea', 'rangeBar', 'boxplot', 'waterfall', 'heatmap', 'histogram']);
function constrainViewport(min, max, full, minimumSpan = 0) {
    if (!full || !Number.isFinite(min) || !Number.isFinite(max) || min >= max)
        return null;
    const fullSpan = full[1] - full[0];
    const span = Math.min(fullSpan, Math.max(max - min, minimumSpan, fullSpan * 1e-9));
    const start = Math.max(full[0], Math.min(min, full[1] - span));
    return { min: start, max: start + span };
}
export const Chart = forwardRef(function Chart({ series = emptySeries, options = emptyOptions, width = '100%', height = 400, className, style, dataVersion, onPointClick, onHover, onViewportChange, onError, ...rest }, forwardedRef) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const frameRef = useRef(null);
    const fullDomainRef = useRef(null);
    const dragRef = useRef(null);
    const latest = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [viewport, setViewport] = useState(null);
    const [hidden, setHidden] = useState([]);
    const [tooltip, setTooltip] = useState(null);
    const [error, setError] = useState(null);
    const [revision, setRevision] = useState(0);
    const descriptionId = useId();
    latest.current = { series, options, onPointClick, onHover, onViewportChange, onError };
    function changeViewport(next) {
        setViewport(next);
        setTooltip(null);
        latest.current.onViewportChange?.(next);
    }
    function zoomAt(factor, ratio = 0.5) {
        const frame = frameRef.current;
        if (!frame)
            return;
        const [min, max] = frame.xDomain;
        const anchor = min + (max - min) * ratio;
        changeViewport(constrainViewport(anchor - (anchor - min) * factor, anchor + (max - anchor) * factor, fullDomainRef.current, latest.current.options.zoom?.minSpan));
    }
    useImperativeHandle(forwardedRef, () => ({
        getCanvas: () => canvasRef.current,
        getFrame: () => frameRef.current,
        resetZoom: () => changeViewport(null),
        setViewport: (min, max) => changeViewport(constrainViewport(min, max, fullDomainRef.current, latest.current.options.zoom?.minSpan)),
        redraw: () => setRevision(value => value + 1),
        exportImage: (type, quality) => canvasRef.current?.toDataURL(type ?? 'image/png', quality) ?? null
    }), []);
    useEffect(() => {
        const element = containerRef.current;
        const measure = () => {
            const rect = element.getBoundingClientRect();
            const next = { width: Math.max(0, Math.floor(rect.width)), height: Math.max(0, Math.floor(rect.height)) };
            setDimensions(previous => previous.width === next.width && previous.height === next.height ? previous : next);
        };
        measure();
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
        observer?.observe(element);
        window.addEventListener('resize', measure);
        return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
    }, []);
    useEffect(() => {
        if (!dimensions.width || !dimensions.height)
            return;
        const request = requestAnimationFrame(() => {
            try {
                const canvas = canvasRef.current;
                const ratio = Math.max(1, Math.min(options.pixelRatio ?? window.devicePixelRatio ?? 1, 4));
                canvas.width = Math.round(dimensions.width * ratio);
                canvas.height = Math.round(dimensions.height * ratio);
                const context = canvas.getContext('2d');
                if (!context)
                    throw new Error('Canvas 2D is not supported in this browser.');
                const resolvedOptions = { ...options, hiddenSeries: [...hidden, ...(options.hiddenSeries ?? [])], xAxis: { ...options.xAxis, ...viewport } };
                const frame = renderChart(context, { ...dimensions, pixelRatio: ratio, series, options: resolvedOptions });
                frameRef.current = frame;
                if (!viewport)
                    fullDomainRef.current = frame.xDomain;
                setError(null);
            }
            catch (cause) {
                frameRef.current = null;
                setError(cause instanceof Error ? cause : new Error(String(cause)));
                latest.current.onError?.(cause);
            }
        });
        return () => cancelAnimationFrame(request);
    }, [series, options, dimensions, viewport, hidden, dataVersion, revision]);
    useEffect(() => {
        const canvas = canvasRef.current;
        const wheel = event => {
            const current = latest.current;
            const frame = frameRef.current;
            if (!current.options.zoom?.enabled || !frame || !interactiveTypes.has(frame.entries[0]?.type))
                return;
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            if (x < frame.plot.left || x > frame.plot.right || y < frame.plot.top || y > frame.plot.bottom)
                return;
            event.preventDefault();
            zoomAt(Math.exp(Math.max(-1, Math.min(1, event.deltaY * 0.002))), (x - frame.plot.left) / frame.plot.width);
        };
        canvas.addEventListener('wheel', wheel, { passive: false });
        return () => canvas.removeEventListener('wheel', wheel);
    }, []);
    function coordinates(event) {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    function pointerMove(event) {
        const frame = frameRef.current;
        if (!frame)
            return;
        const position = coordinates(event);
        if (dragRef.current) {
            const drag = dragRef.current;
            if (Math.abs(position.x - drag.start) > 3)
                drag.moved = true;
            const delta = (drag.start - position.x) / frame.plot.width * (drag.domain[1] - drag.domain[0]);
            changeViewport(constrainViewport(drag.domain[0] + delta, drag.domain[1] + delta, fullDomainRef.current, options.zoom?.minSpan));
            return;
        }
        const hit = frame.hitTest(position.x, position.y);
        if (options.tooltip?.enabled !== false || options.crosshair?.enabled)
            setTooltip(hit ? { ...position, hit } : null);
        onHover?.(hit);
    }
    function pointerDown(event) {
        const frame = frameRef.current;
        if (!options.zoom?.enabled || options.zoom.pan === false || !frame || !interactiveTypes.has(frame.entries[0]?.type) || event.button !== 0)
            return;
        const { x, y } = coordinates(event);
        if (x < frame.plot.left || x > frame.plot.right || y < frame.plot.top || y > frame.plot.bottom)
            return;
        dragRef.current = { start: x, domain: frame.xDomain, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
    }
    function pointerUp(event) {
        const moved = dragRef.current?.moved;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture?.(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        if (!moved && frameRef.current) {
            const { x, y } = coordinates(event);
            const hit = frameRef.current.hitTest(x, y);
            if (hit)
                onPointClick?.(hit, event);
        }
    }
    function keyDown(event) {
        if (event.key === 'Escape') {
            setTooltip(null);
            return;
        }
        if (!options.zoom?.enabled || !interactiveTypes.has(frameRef.current?.entries[0]?.type))
            return;
        if (['+', '=', '-', 'Home', 'ArrowLeft', 'ArrowRight'].includes(event.key))
            event.preventDefault();
        if (event.key === '+' || event.key === '=')
            zoomAt(0.7);
        else if (event.key === '-')
            zoomAt(1.3);
        else if (event.key === 'Home')
            changeViewport(null);
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const domain = frameRef.current?.xDomain;
            if (!domain)
                return;
            const shift = (domain[1] - domain[0]) * (event.key === 'ArrowLeft' ? -0.15 : 0.15);
            changeViewport(constrainViewport(domain[0] + shift, domain[1] + shift, fullDomainRef.current, options.zoom?.minSpan));
        }
    }
    const accessibleName = options.accessibility?.label ?? options.title ?? 'Chart';
    const tooltipContent = tooltip ? options.tooltip?.formatter?.(tooltip.hit) ?? `${tooltip.hit.series.name ?? 'Series'}: ${tooltip.hit.point.label ?? tooltip.hit.point.x}, ${tooltip.hit.point.y}` : null;
    const palette = options.colors?.length ? options.colors : defaultColors;
    return createElement('figure', { ...rest, className, style: { margin: 0, minWidth: 0, ...style }, 'aria-label': accessibleName }, createElement('div', { ref: containerRef, style: { position: 'relative', width, height, maxWidth: '100%', minWidth: 0 } }, createElement('canvas', {
        ref: canvasRef, role: 'img', 'aria-label': accessibleName, 'aria-describedby': descriptionId, tabIndex: 0,
        style: { display: 'block', width: '100%', height: '100%', touchAction: options.zoom?.enabled ? 'pan-y' : 'auto', cursor: options.zoom?.enabled ? 'crosshair' : 'default' },
        onPointerMove: pointerMove, onPointerDown: pointerDown, onPointerUp: pointerUp,
        onPointerCancel: () => { dragRef.current = null; }, onPointerLeave: () => { if (!dragRef.current) {
            setTooltip(null);
            onHover?.(null);
        } },
        onKeyDown: keyDown, onDoubleClick: () => { if (options.zoom?.enabled)
            changeViewport(null); }
    }, accessibleName), options.crosshair?.enabled && tooltip && frameRef.current ? createElement('div', { 'aria-hidden': true, style: { position: 'absolute', pointerEvents: 'none', left: tooltip.x, top: frameRef.current.plot.top, height: frameRef.current.plot.height, borderLeft: `1px dashed ${options.crosshair.color ?? '#718780'}` } }) : null, tooltip && options.tooltip?.enabled !== false ? createElement('div', { role: 'status', style: { position: 'absolute', pointerEvents: 'none', boxSizing: 'border-box', left: Math.max(4, Math.min(tooltip.x + 12, dimensions.width - 232)), top: Math.max(4, Math.min(tooltip.y + 12, dimensions.height - 70)), maxWidth: Math.max(1, Math.min(220, dimensions.width - 8)), padding: '8px 10px', borderRadius: 4, background: '#203b34', color: '#ffffff', font: '12px sans-serif', overflowWrap: 'anywhere', ...options.tooltip?.style } }, tooltipContent) : null, error ? createElement('div', { role: 'alert', style: { position: 'absolute', inset: 12, display: 'grid', placeContent: 'center', background: '#fff5f2', color: '#a02c20', padding: 16, overflow: 'auto', overflowWrap: 'anywhere' } }, error.message) : null), createElement('p', { id: descriptionId, style: visuallyHidden }, options.accessibility?.description ?? `${series.length} data series. ${options.zoom?.enabled ? 'Use plus or minus to zoom, arrow keys to pan, and Home to reset.' : ''}`), options.legend?.enabled !== false && series.length > 0 ? createElement('div', { 'aria-label': 'Chart legend', style: { display: 'flex', flexWrap: 'wrap', justifyContent: options.legend?.align ?? 'center', gap: '6px 16px', padding: '10px 0', ...options.legend?.style } }, series.map((item, index) => {
        const id = item.id ?? String(index);
        const isHidden = hidden.includes(id) || options.hiddenSeries?.includes(id) || item.visible === false;
        return createElement('button', { key: id, type: 'button', 'aria-pressed': !isHidden, disabled: item.visible === false || options.hiddenSeries?.includes(id), onClick: () => { setTooltip(null); setHidden(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); }, style: { display: 'inline-flex', alignItems: 'center', gap: 7, border: 0, background: 'transparent', padding: '4px 2px', color: options.textColor ?? '#344b43', font: 'inherit', fontSize: 12, cursor: 'pointer', opacity: isHidden ? 0.45 : 1, textDecoration: isHidden ? 'line-through' : 'none' } }, createElement('span', { 'aria-hidden': true, style: { width: 10, height: 10, display: 'inline-block', background: item.color ?? palette[index % palette.length], borderRadius: 2, flexShrink: 0 } }), item.name ?? `Series ${index + 1}`);
    })) : null, options.accessibility?.table ? createElement('table', { style: visuallyHidden }, createElement('caption', null, `${accessibleName}: first ${options.accessibility.maxRows ?? 50} points per series`), createElement('thead', null, createElement('tr', null, ['Series', 'X', 'Y'].map(text => createElement('th', { key: text, scope: 'col' }, text)))), createElement('tbody', null, series.flatMap((item, seriesIndex) => Array.from({ length: Math.min(dataLength(item.data), Math.max(0, Math.min(1000, options.accessibility.maxRows ?? 50))) }, (_, index) => {
        const point = pointAt(item.data, index);
        return createElement('tr', { key: `${seriesIndex}:${index}` }, createElement('td', null, item.name ?? `Series ${seriesIndex + 1}`), createElement('td', null, point.label ?? String(point.x)), createElement('td', null, String(point.y ?? '')));
    })))) : null);
});
Chart.displayName = 'Chart';
