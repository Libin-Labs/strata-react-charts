import React, { createElement as element, useEffect, useRef, useState } from 'react';
import { Chart, chartTypes } from '../src/index.js';
import { chartGroups, createDemo, demoCatalog, denseTypes, resolveDemo } from './catalog.js';
import { Documentation } from './docs.js';

const validTabs = new Set(['guide', 'code', 'playground', 'reference']);
const sampleTypes = ['donut', 'candlestick', 'column'];
const datasetSizes = [[120, '120'], [10000, '10K'], [1000000, '1M']];
const miniOptions = { legend: { enabled: false }, margin: { left: 36, right: 12, top: 12, bottom: 26 }, fontSize: 10, fontFamily: 'Trebuchet MS', xAxis: { tickCount: 3 }, yAxis: { tickCount: 3 } };

function readRoute() {
    const parameters = new URLSearchParams(location.hash.slice(1));
    const type = parameters.get('chart');
    const tab = parameters.get('tab');
    return { type: chartTypes.includes(type) ? type : 'area', tab: validTabs.has(tab) ? tab : 'guide' };
}

function Header({ onDocumentation }) {
    return element('header', { className: 'topbar' },
        element('div', { className: 'brand' },
            element('span', { className: 'brand-mark', 'aria-hidden': true }, element('i'), element('i'), element('i')),
            element('span', { className: 'brand-name' }, 'Strata'), element('span', { className: 'version' }, 'REACT CHARTS / 0.1')),
        element('nav', { className: 'top-links', 'aria-label': 'Documentation links' },
            element('button', { type: 'button', className: 'text-link', onClick: onDocumentation }, 'Documentation'),
            element('a', { href: '../README.md', target: '_blank', rel: 'noreferrer' }, 'README')));
}

function Sidebar({ type, onSelect }) {
    return element('aside', { className: 'sidebar' },
        element('p', { className: 'section-label' }, 'Examples & guides'),
        element('nav', { className: 'chart-nav', 'aria-label': 'Chart families' },
            Object.entries(chartGroups).map(([name, types]) => element('button', {
                key: name, type: 'button', className: types.includes(type) ? 'active' : '', onClick: () => onSelect(types[0])
            }, name, element('small', null, String(types.length).padStart(2, '0'))))),
        element('nav', { className: 'type-nav', 'aria-label': 'All chart examples' },
            chartTypes.map(value => element('a', {
                key: value, href: `#chart=${value}&tab=guide`, 'aria-current': value === type ? 'page' : undefined,
                onClick: event => { event.preventDefault(); onSelect(value); }
            }, demoCatalog[value].title))),
        element('div', { className: 'sidebar-note' }, '28 examples', element('br'), 'React 18 & 19', element('br'), 'MIT licensed'));
}

function Statistics({ type, configuration }) {
    const data = configuration.series[0].data;
    const count = data?.y?.length ?? data?.length ?? 0;
    const facts = [['Data points', count.toLocaleString()], ['Chart family', demoCatalog[type].title], ['Draw budget', denseTypes.has(type) ? String(configuration.options.performance?.maxPoints ?? 1800) : String(count)], ['Renderer', 'Canvas 2D']];
    return element('dl', { className: 'stats' }, facts.map(([name, value]) => element('div', { className: 'stat', key: name }, element('dt', null, name), element('dd', null, value))));
}

function Toolbar({ type, count, configuration, onType, onCount, onChange, onResetZoom }) {
    return element('section', { className: 'toolbar', 'aria-label': 'Chart settings' },
        element('label', null, 'Chart', element('select', { value: type, 'aria-label': 'Chart type', onChange: event => onType(event.target.value) },
            chartTypes.map(value => element('option', { value, key: value }, demoCatalog[value].title)))),
        element('div', { className: 'segmented', role: 'group', 'aria-label': 'Dataset size' }, datasetSizes.map(([value, label]) => element('button', {
            type: 'button', key: value, disabled: !denseTypes.has(type), 'aria-pressed': denseTypes.has(type) && count === value, onClick: () => onCount(value)
        }, label))),
        element('label', null, 'Color', element('input', { type: 'color', 'aria-label': 'Series color', value: configuration.series[0].color ?? '#087f75', onChange: event => onChange('series.color', event.target.value) })),
        element('label', null, element('input', { type: 'checkbox', checked: configuration.options.grid?.visible !== false, onChange: event => onChange('options.grid.visible', event.target.checked) }), 'Grid'),
        element('label', null, element('input', { type: 'checkbox', checked: configuration.options.dataLabels?.enabled ?? false, onChange: event => onChange('options.dataLabels.enabled', event.target.checked) }), 'Labels'),
        element('button', { type: 'button', className: 'reset', title: 'Reset zoom', 'aria-label': 'Reset zoom', onClick: onResetZoom }, '\u21ba'));
}

function Samples({ onSelect }) {
    return element('section', { className: 'gallery', 'aria-label': 'Related examples' }, sampleTypes.map(type => {
        const demo = createDemo(type);
        const options = { ...demo.options, ...miniOptions };
        if (type === 'donut') options.margin = { top: 2, left: 0, right: 0, bottom: 2 };
        return element('article', { key: type, className: 'sample' },
            element('h3', null, demoCatalog[type].title),
            element(Chart, { series: demo.series, options, height: 165 }),
            element('a', { href: `#chart=${type}&tab=guide`, onClick: event => { event.preventDefault(); onSelect(type); } }, 'Example, code & guide'));
    }));
}

function App() {
    const [route, setRoute] = useState(readRoute);
    const [count, setCount] = useState(120);
    const [changes, setChanges] = useState({});
    const [selected, setSelected] = useState(null);
    const [viewport, setViewport] = useState(null);
    const chartRef = useRef(null);
    const routeRef = useRef(route);
    routeRef.current = route;
    const demo = createDemo(route.type, count);
    const configuration = resolveDemo(demo, changes);

    useEffect(() => {
        const update = () => {
            const next = readRoute();
            if (next.type !== routeRef.current.type) { setChanges({}); setSelected(null); setViewport(null); }
            setRoute(next);
        };
        window.addEventListener('hashchange', update);
        return () => window.removeEventListener('hashchange', update);
    }, []);

    function navigate(next) {
        if (next.type !== route.type) { setChanges({}); setSelected(null); setViewport(null); }
        setRoute(next);
        location.hash = new URLSearchParams({ chart: next.type, tab: next.tab }).toString();
    }

    function chooseType(type) { navigate({ type, tab: route.tab }); }

    function changeOption(path, value) {
        if (path === 'options.type') { chooseType(value); return; }
        setChanges(previous => {
            const next = { ...previous };
            if (value === undefined) delete next[path];
            else next[path] = value;
            return next;
        });
    }

    function exportPNG() {
        const image = chartRef.current?.exportImage();
        if (!image) return;
        const link = document.createElement('a');
        link.download = `strata-${route.type}.png`;
        link.href = image;
        link.click();
    }

    function openDocumentation() {
        navigate({ ...route, tab: 'reference' });
        document.getElementById('documentation')?.scrollIntoView({ block: 'start' });
    }

    const guide = demoCatalog[route.type];
    const heading = element('section', { className: 'page-heading' },
        element('div', null, element('p', { className: 'eyebrow' }, `Examples / ${guide.group}`), element('h1', null, `Strata ${guide.title}`), element('p', { className: 'heading-meta' }, guide.description)),
        element('button', { type: 'button', className: 'export-button', onClick: exportPNG }, 'Export PNG'));
    const toolbar = element(Toolbar, {
        type: route.type, count, configuration, onType: chooseType, onChange: changeOption,
        onCount: value => { setCount(value); chartRef.current?.resetZoom(); }, onResetZoom: () => chartRef.current?.resetZoom()
    });
    const chart = element('section', { className: 'chart-surface', 'aria-label': 'Live chart preview' },
        element(Chart, { ...configuration.props, key: route.type, ref: chartRef, series: configuration.series, options: configuration.options, onPointClick: setSelected, onViewportChange: setViewport }),
        element('div', { className: 'selection', 'aria-live': 'polite' },
            element('span', null, selected ? `Selected: ${selected.point.label ?? selected.index} / ${Number(selected.point.y).toFixed(2)}` : 'No observation selected'),
            element('span', null, viewport ? `Visible: ${Math.round(viewport.min).toLocaleString()} - ${Math.round(viewport.max).toLocaleString()}` : 'Full dataset')));
    const documentation = element(Documentation, {
        key: route.type, type: route.type, demo, configuration, changes, tab: route.tab,
        onTabChange: tab => navigate({ ...route, tab }), onChange: changeOption, onReset: () => { setChanges({}); chartRef.current?.resetZoom(); }
    });
    return element(React.Fragment, null,
        element(Header, { onDocumentation: openDocumentation }),
        element('div', { className: 'layout' }, element(Sidebar, { type: route.type, onSelect: chooseType }),
            element('main', null, heading, element(Statistics, { type: route.type, configuration }), toolbar, chart, documentation,
                element('div', { className: 'gallery-heading' }, element('h2', null, 'More examples')),
                element(Samples, { onSelect: chooseType }),
                element('footer', { className: 'footer' }, element('span', null, 'STRATA / REACT CHARTS'), element('a', { href: '../README.md' }, 'Full documentation')))));
}

window.ReactDOM.createRoot(document.getElementById('root')).render(element(React.StrictMode, null, element(App)));