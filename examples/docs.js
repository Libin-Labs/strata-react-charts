import { createElement as element, useEffect, useState } from 'react';
import { createSnippet, demoCatalog } from './catalog.js';
import { apiReference, functionPresets, optionGroups, pointReference } from './reference.js';

const tabs = [['guide', 'Chart guide'], ['code', 'React code'], ['playground', 'All options'], ['reference', 'API reference']];

function valueAtPath(configuration, path) {
    const root = { options: configuration.options, series: configuration.series[0], props: configuration.props };
    return path.split('.').reduce((value, key) => value?.[key], root);
}

function displayDefault(value) {
    if (value === undefined || value === '') return 'Automatic / unset';
    if (typeof value === 'function') return 'Callback';
    return JSON.stringify(value);
}

function CopyButton({ code }) {
    const [status, setStatus] = useState('Copy code');
    useEffect(() => setStatus('Copy code'), [code]);
    async function copy() {
        try {
            await navigator.clipboard.writeText(code);
            setStatus('Copied');
        } catch {
            setStatus('Select code to copy');
        }
    }
    return element('button', { type: 'button', className: 'export-button', onClick: copy, 'aria-live': 'polite' }, status);
}

function CodePanel({ demo, configuration }) {
    const code = createSnippet(demo, configuration);
    return element('section', { className: 'documentation-section' },
        element('div', { className: 'docs-heading' }, element('h2', null, 'React example'), element(CopyButton, { code })),
        element('pre', { className: 'install-code' }, element('code', null, 'npm install @lp-labs/strata-react-charts')),
        element('pre', { className: 'source-code', tabIndex: 0, 'aria-label': 'React example source' }, element('code', null, code))
    );
}

function GuidePanel({ type }) {
    const guide = demoCatalog[type];
    return element('article', { className: 'documentation-section guide-layout' },
        element('div', null,
            element('h2', null, `${guide.title} chart`),
            element('p', null, guide.description),
            element('h3', null, 'Data contract'),
            element('p', null, element('code', null, guide.fields)),
            element('p', null, guide.notes),
            element('h3', null, 'Performance'), element('p', null, guide.performance)),
        element('div', null,
            element('h3', null, 'React integration'),
            element('p', null, 'React 18 or 19 is the only peer dependency. No chart stylesheet is required. Keep data identity stable between renders.'),
            element('h3', null, 'Updates and accessibility'),
            element('p', null, 'Use a new data object for updates. In-place changes require invalidateData(data) and a changed dataVersion. Provide an accessible label and an optional bounded data table.'),
            element('h3', null, 'Customization'),
            element('p', null, 'All options lists the supported settings. Settings apply only to their chart families; the generated React code follows the current configuration.'),
            element('a', { href: '../README.md', target: '_blank', rel: 'noreferrer' }, 'Read the full library documentation'))
    );
}

function JsonControl({ field, value, onChange }) {
    const [draft, setDraft] = useState(value === undefined ? '' : JSON.stringify(value, null, 2));
    const [error, setError] = useState('');
    useEffect(() => {
        setDraft(value === undefined ? '' : JSON.stringify(value, null, 2));
        setError('');
    }, [value]);
    function apply() {
        try {
            onChange(field.path, draft.trim() ? JSON.parse(draft) : undefined);
            setError('');
        } catch (cause) {
            setError(cause.message);
        }
    }
    return element('div', { className: 'json-control' },
        element('textarea', { id: field.path, rows: 3, value: draft, placeholder: field.path === 'series.data' ? '[{"x":0,"y":12},{"x":1,"y":24}]' : 'JSON value', onChange: event => setDraft(event.target.value), spellCheck: false, 'aria-describedby': `${field.path}-description` }),
        element('button', { type: 'button', className: 'apply-json', onClick: apply }, 'Apply JSON'),
        error ? element('span', { className: 'field-error', role: 'alert' }, error) : null);
}

function FunctionControl({ field, value, onChange }) {
    const presets = functionPresets[field.presets];
    const selected = Object.keys(presets).find(key => presets[key] === value) ?? Object.keys(presets)[0];
    return element('select', { id: field.path, value: selected, onChange: event => onChange(field.path, presets[event.target.value]) },
        Object.keys(presets).map(key => element('option', { key, value: key }, key)));
}

function ScalarControl({ field, value, onChange }) {
    const attributes = { id: field.path, 'aria-describedby': `${field.path}-description` };
    if (field.kind === 'boolean') return element('input', { ...attributes, type: 'checkbox', checked: Boolean(value), onChange: event => onChange(field.path, event.target.checked) });
    if (field.kind === 'select') return element('select', { ...attributes, value: value ?? '', onChange: event => onChange(field.path, event.target.value || undefined) },
        field.choices.map(choice => element('option', { key: choice, value: choice }, choice || 'Inherit chart type')));
    if (field.kind === 'number') return element('input', {
        ...attributes, type: 'number', value: value ?? '', min: field.min, max: field.max, step: field.step ?? 'any',
        onChange: event => {
            if (event.target.value === '') { onChange(field.path, undefined); return; }
            const numeric = Number(event.target.value);
            if (Number.isFinite(numeric)) onChange(field.path, numeric);
        }
    });
    return element('input', { ...attributes, type: field.kind === 'color' ? 'color' : 'text', value: value ?? '', onChange: event => {
        const next = event.target.value;
        onChange(field.path, field.path === 'props.width' && /^\d+$/.test(next) ? Number(next) : next);
    } });
}

function OptionControl({ field, configuration, changes, onChange }) {
    let value = valueAtPath(configuration, field.path) ?? field.fallback;
    if (field.path === 'series.data' && !Object.hasOwn(changes, field.path)) value = undefined;
    let control;
    if (field.kind === 'json') control = element(JsonControl, { field, value, onChange });
    else if (field.kind === 'function') control = element(FunctionControl, { field, value, onChange });
    else control = element(ScalarControl, { field, value, onChange });
    return element('div', { className: `option-field option-field-${field.kind}` },
        element('label', { htmlFor: field.path }, field.label),
        element('code', { className: 'option-path' }, field.path), control,
        element('small', { id: `${field.path}-description` }, field.description));
}

function PlaygroundPanel({ configuration, changes, onChange, onReset }) {
    return element('section', { className: 'documentation-section' },
        element('div', { className: 'docs-heading' }, element('h2', null, 'All supported options'), element('button', { type: 'button', className: 'export-button', onClick: onReset }, 'Reset options')),
        element('p', { className: 'docs-muted' }, 'Series controls edit the first series. Family-specific settings are documented next to each field. Incompatible values appear in the chart error state. JSON changes apply only when confirmed.'),
        optionGroups.map((group, index) => element('details', { key: group.title, className: 'option-group', open: index === 0 },
            element('summary', null, group.title, element('span', null, `${group.fields.length} settings`)),
            element('div', { className: 'options-grid' }, group.fields.map(field => element(OptionControl, { key: field.path, field, configuration, changes, onChange }))))));
}

function ReferenceTable({ title, rows }) {
    return element('section', { className: 'reference-section' }, element('h3', null, title),
        element('div', { className: 'table-scroll' }, element('table', { className: 'reference-table' },
            element('thead', null, element('tr', null, element('th', { scope: 'col' }, 'Property / method'), element('th', { scope: 'col' }, 'Contract'))),
            element('tbody', null, rows.map(([name, description]) => element('tr', { key: name }, element('td', null, element('code', null, name)), element('td', null, description)))))));
}

function OptionReferenceGroup({ group, query }) {
    const fields = group.fields.filter(field => `${field.path} ${field.description}`.toLowerCase().includes(query.toLowerCase()));
    if (!fields.length) return null;
    const rows = fields.map(field => element('tr', { key: field.path },
        element('td', null, element('code', null, field.path)),
        element('td', null, element('code', null, displayDefault(field.fallback))),
        element('td', null, field.description,
            field.choices ? element('div', null, element('code', null, field.choices.filter(Boolean).join(' | '))) : null)));
    const headings = ['Option', 'Default / preset', 'Contract'].map(text => element('th', { key: text, scope: 'col' }, text));
    const table = element('table', { className: 'reference-table' },
        element('thead', null, element('tr', null, headings)), element('tbody', null, rows));
    return element('section', { className: 'reference-section' }, element('h3', null, group.title),
        element('div', { className: 'table-scroll' }, table));
}

function ReferencePanel() {
    const [query, setQuery] = useState('');
    const matches = text => text.toLowerCase().includes(query.toLowerCase());
    return element('section', { className: 'documentation-section' },
        element('div', { className: 'docs-heading' }, element('h2', null, 'API reference'), element('label', { className: 'reference-search' }, 'Filter options', element('input', { type: 'search', value: query, onChange: event => setQuery(event.target.value), placeholder: 'Search name or description' }))),
        optionGroups.map(group => element(OptionReferenceGroup, { key: group.title, group, query })),
        element(ReferenceTable, { title: 'Point fields', rows: pointReference.filter(row => matches(row.join(' '))) }),
        element(ReferenceTable, { title: 'Component callbacks and ref methods', rows: apiReference.filter(row => matches(row.join(' '))) }));
}

export function Documentation({ type, demo, configuration, changes, tab, onTabChange, onChange, onReset }) {
    const panels = {
        guide: () => element(GuidePanel, { type }),
        code: () => element(CodePanel, { demo, configuration }),
        playground: () => element(PlaygroundPanel, { configuration, changes, onChange, onReset }),
        reference: () => element(ReferencePanel)
    };
    function navigate(event, index) {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        onTabChange(tabs[next][0]);
        event.currentTarget.parentElement.children[next].focus();
    }
    return element('section', { className: 'documentation', id: 'documentation' },
        element('div', { className: 'docs-tabs', role: 'tablist', 'aria-label': 'Example documentation' }, tabs.map(([key, title], index) => element('button', {
            key, id: `tab-${key}`, type: 'button', role: 'tab', 'aria-selected': tab === key, 'aria-controls': `panel-${key}`, tabIndex: tab === key ? 0 : -1,
            onClick: () => onTabChange(key), onKeyDown: event => navigate(event, index)
        }, title))),
        element('div', { role: 'tabpanel', id: `panel-${tab}`, 'aria-labelledby': `tab-${tab}`, tabIndex: 0 }, (panels[tab] ?? panels.guide)()));
}