# Gauge Chart

Show one value within a half-circle progress range.

Chart type: `gauge`.

[All charts](../README.md) | [Shared configuration](../../configuration/README.md) | [Package overview](../../../README.md)

## Install

```sh
npm install @lp-labs/strata-react-charts
```

Requires React 18 or 19. TypeScript declarations are included; no chart stylesheet is required.

## React Example

```jsx
import { Chart } from '@lp-labs/strata-react-charts';

const series = [
    {
        "id": "primary",
        "name": "Observed",
        "data": [
            {
                "y": 72,
                "label": "Capacity"
            }
        ],
        "lineWidth": 18
    }
];

const options = {
    "type": "gauge",
    "title": "Gauge example",
    "background": "#ffffff",
    "tooltip": {
        "enabled": true
    },
    "legend": {
        "enabled": true
    },
    "accessibility": {
        "label": "Gauge observations",
        "table": true,
        "maxRows": 20
    },
    "performance": {
        "maxItems": 2000
    },
    "yAxis": {
        "min": 0,
        "max": 100
    }
};

const chartProps = {
    "width": "100%",
    "height": 400
};

export default function Example() {
    return (
        <Chart
            {...chartProps}
            series={series}
            options={options}
            onPointClick={hit => console.log('Selected', hit)}
            onHover={hit => console.log('Hover', hit)}
            onViewportChange={range => console.log('Viewport', range)}
            onError={error => console.error(error)}
        />
    );
}
```

The data is declared outside render to keep its identity stable. The example uses explicit settings; the tables below describe library defaults.

## Data Fields

| Field | Requirement | Meaning |
| --- | --- | --- |
| `y` | Required | Required numeric value or null. Use close/median/midpoint as representative y for specialized charts. |
| `label` | Optional | Object-point category or tooltip label. |

Numeric arrays use their index as x; tuples use [x, y]; objects support named fields. Numeric column objects support typed arrays and optional numeric shape fields. Use object points for labels, colors, and waterfall total flags. All supplied columns should have matching lengths.

## Series Configuration

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `series.id` | text | Stringified series index | Unique stable ID used by hiddenSeries and legend toggles. |
| `series.name` | text | Series N | Legend and tooltip label. |
| `series.type` | line / spline / step / area / stackedArea / column / bar / stackedColumn / stackedBar / scatter / bubble / pie / donut / polar / radar / heatmap / treemap / candlestick / ohlc / rangeArea / rangeBar / histogram / boxplot / waterfall / funnel / pyramid / gauge / bullet | options.type | Overrides chart type for this series; incompatible families cannot mix. |
| `series.data` | json | Required | Replace the first series with a JSON array or column object. Leave unchanged to retain generated data. |
| `series.visible` | boolean | true | False hides the series and disables its legend toggle. |
| `series.color` | color | Palette color at series index | Overrides the palette; object-point color takes precedence. |
| `series.lineWidth` | number | max(8, radius * 0.16) | Cartesian strokes, radar lines, or gauge thickness. |
| `series.opacity` | number | 1 | Overall Cartesian/radial series alpha. |

## Chart Configuration

Only options relevant to this chart are listed. For all public options, callback signatures, and component props, see the [shared configuration reference](../../configuration/README.md).

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.type` | line / spline / step / area / stackedArea / column / bar / stackedColumn / stackedBar / scatter / bubble / pie / donut / polar / radar / heatmap / treemap / candlestick / ohlc / rangeArea / rangeBar / histogram / boxplot / waterfall / funnel / pyramid / gauge / bullet | gauge | Default type for series without their own type. |
| `options.title` | text | Automatic / unset | Canvas title, included in image export. |
| `options.titleFontSize` | number | 18 | Title font size in CSS pixels. |
| `options.colors` | json | Built-in eight-color palette | Nonempty array of CSS colors. |
| `options.background` | color | "#ffffff" | Canvas background color. |
| `options.textColor` | color | Context-dependent: #243d36 or #485653 | Default text color. |
| `options.fontFamily` | text | "sans-serif" | A font already available in the browser. |
| `options.fontSize` | number | 12 | Canvas text size in CSS pixels. |
| `options.pixelRatio` | number | Automatic / unset | Defaults to device ratio; React caps the value at 1..4. |
| `options.emptyText` | text | "No data" | Text when no visible series contains points. |
| `options.margin.top` | number | 20; 56 with a title | Plot margin in CSS pixels. |
| `options.margin.right` | number | 24 | Plot margin in CSS pixels. |
| `options.margin.bottom` | number | 42; 62 with an x-axis title; 20 for radial/partition charts | Plot margin in CSS pixels. |
| `options.margin.left` | number | 64; 82 with a y-axis title; 20 for radial/partition charts | Plot margin in CSS pixels. |
| `options.grid.color` | color | "#e5e9e9" | Grid-line color. |
| `options.yAxis.min` | number | Automatic / unset | Explicit finite lower bound; less than maximum. |
| `options.yAxis.max` | number | Automatic / unset | Explicit finite upper bound; greater than minimum. |
| `options.dataLabels.formatter` | function | Automatic / unset | Function (point, series) => string. |
| `options.tooltip.enabled` | boolean | true | React tooltip overlay. |
| `options.tooltip.hitRadius` | number | 24 | Nearest-point tolerance in CSS pixels. |
| `options.tooltip.formatter` | function | Automatic / unset | Function (hit) => plain text; no HTML injection. |
| `options.tooltip.style` | json | Automatic / unset | React inline-style object; camelCase CSS keys. |
| `options.legend.enabled` | boolean | true | React series-toggle buttons. |
| `options.legend.align` | start / center / end | "center" | Horizontal alignment. |
| `options.legend.style` | json | Automatic / unset | React inline-style object. |
| `options.hiddenSeries` | json | [] | IDs forced hidden, for example ["primary"]. |
| `options.crosshair.enabled` | boolean | false | Vertical pointer overlay when a hit is found. |
| `options.crosshair.color` | color | "#718780" | Vertical crosshair stroke. |
| `options.performance.maxItems` | number | 2000 | Reject detailed inputs above this limit rather than silently sample. |
| `options.accessibility.label` | text | options.title or Chart | Accessible name for the figure and canvas. |
| `options.accessibility.description` | text | Generated series summary | Screen-reader chart summary. |
| `options.accessibility.table` | boolean | false | Include a visually hidden, bounded data table. |
| `options.accessibility.maxRows` | number | 50 | Table rows per series, capped at 1000. |
| `options.hooks.beforeDraw` | function | Automatic / unset | Canvas hook (context, frame); keep save/restore balanced. |
| `options.hooks.afterDraw` | function | Automatic / unset | Canvas overlay hook (context, frame). |

## Behavior and Limitations

- Set yAxis min/max for the value range; defaults are 0 and 100. Only the first point is drawn.
- This type accepts exactly one visible series. Other chart families cannot be mixed into it.
- Cartesian axis titles, category ticks, and x zoom do not apply. Only the radial y limits listed below affect gauge/radar/polar geometry.
- The numeric value is always displayed. dataLabels.formatter customizes its text; dataLabels.enabled and dataLabels.color are not used.

## Performance and Updates

Detailed geometry is not silently sampled. The default limit is 2,000 items per series; aggregate first or explicitly raise performance.maxItems.

Prefer a new data object when values change. In-place changes require invalidateData(data) and a changed dataVersion or ref.redraw(). Changing dataVersion alone does not invalidate cached indexes. The first index and each invalidation cost O(n).

## Interaction and Export

Tooltips and onPointClick use rendered geometry. The legend toggles visible series. Provide accessibility.label and an optional bounded data table.

This chart does not support x-axis zoom or pointer panning.

Use a React ref for getCanvas(), getFrame(), redraw(), and exportImage(type?, quality?). Image export defaults to PNG and excludes HTML legend/tooltip overlays. See the [ref and callback reference](../../configuration/README.md#callbacks-and-ref-methods).

## Related Charts

- [Radar](../radar/README.md)
- [Polar](../polar/README.md)
