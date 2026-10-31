# Column Chart

Compare categories with grouped vertical bars.

Chart type: `column`.

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
                "x": 0,
                "y": 42,
                "label": "North"
            },
            {
                "x": 1,
                "y": 64,
                "label": "South"
            },
            {
                "x": 2,
                "y": 51,
                "label": "East"
            },
            {
                "x": 3,
                "y": 78,
                "label": "West"
            },
            {
                "x": 4,
                "y": 57,
                "label": "Central"
            },
            {
                "x": 5,
                "y": 91,
                "label": "Coastal"
            },
            {
                "x": 6,
                "y": 74,
                "label": "Metro"
            },
            {
                "x": 7,
                "y": 85,
                "label": "Rural"
            }
        ],
        "barWidth": 28
    }
];

const options = {
    "type": "column",
    "title": "Column example",
    "background": "#ffffff",
    "tooltip": {
        "enabled": true
    },
    "legend": {
        "enabled": true
    },
    "accessibility": {
        "label": "Column observations",
        "table": true,
        "maxRows": 20
    },
    "xAxis": {
        "title": "Observation"
    },
    "yAxis": {
        "title": "Value"
    },
    "grid": {
        "visible": true,
        "color": "#e5e9e9"
    },
    "zoom": {
        "enabled": true,
        "pan": true
    },
    "performance": {
        "maxItems": 2000
    },
    "dataLabels": {
        "enabled": true
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
| `x` | Optional; defaults to point index | Numeric coordinate; defaults to point index. Time uses epoch milliseconds. |
| `y` | Required | Required numeric value or null. Use close/median/midpoint as representative y for specialized charts. |
| `label` | Optional | Object-point category or tooltip label. |
| `color` | Optional | Object-point CSS color override. |

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
| `series.opacity` | number | 1 | Overall Cartesian/radial series alpha. |
| `series.barWidth` | number | 36 | Bar/category pixel-width cap. |

## Chart Configuration

Only options relevant to this chart are listed. For all public options, callback signatures, and component props, see the [shared configuration reference](../../configuration/README.md).

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.type` | line / spline / step / area / stackedArea / column / bar / stackedColumn / stackedBar / scatter / bubble / pie / donut / polar / radar / heatmap / treemap / candlestick / ohlc / rangeArea / rangeBar / histogram / boxplot / waterfall / funnel / pyramid / gauge / bullet | column | Default type for series without their own type. |
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
| `options.grid.visible` | boolean | true | Cartesian grid and radial rings. |
| `options.grid.color` | color | "#e5e9e9" | Grid-line color. |
| `options.grid.dash` | json | [] | Canvas dash-length array, for example [4, 3]. |
| `options.xAxis.min` | number | Automatic / unset | Explicit finite lower bound; less than maximum. |
| `options.xAxis.max` | number | Automatic / unset | Explicit finite upper bound; greater than minimum. |
| `options.xAxis.visible` | boolean | true | Cartesian axis ticks and labels. |
| `options.xAxis.tickCount` | number | 5 | Between 2 and 20 intervals. |
| `options.xAxis.formatter` | function | Automatic / unset | Function (numeric value) => string. |
| `options.xAxis.categories` | json | Automatic / unset | Array of strings, indexed by rounded tick value. |
| `options.xAxis.type` | linear / time | "linear" | Time expects epoch milliseconds; logarithmic scales are not implemented. |
| `options.xAxis.title` | text | Automatic / unset | Increase margins for long axis titles. |
| `options.xAxis.color` | color | "#485653" | Tick and axis-title text color. |
| `options.yAxis.min` | number | Automatic / unset | Explicit finite lower bound; less than maximum. |
| `options.yAxis.max` | number | Automatic / unset | Explicit finite upper bound; greater than minimum. |
| `options.yAxis.visible` | boolean | true | Cartesian axis ticks and labels. |
| `options.yAxis.tickCount` | number | 5 | Between 2 and 20 intervals. |
| `options.yAxis.formatter` | function | Automatic / unset | Function (numeric value) => string. |
| `options.yAxis.categories` | json | Automatic / unset | Array of strings, indexed by rounded tick value. |
| `options.yAxis.type` | linear / time | "linear" | Time expects epoch milliseconds; logarithmic scales are not implemented. |
| `options.yAxis.title` | text | Automatic / unset | Increase margins for long axis titles. |
| `options.yAxis.color` | color | "#485653" | Tick and axis-title text color. |
| `options.dataLabels.enabled` | boolean | false | Detailed/radial labels; dense XY paths omit labels. |
| `options.dataLabels.color` | color | Context-dependent text color | Data label text color. |
| `options.dataLabels.formatter` | function | Automatic / unset | Function (point, series) => string. |
| `options.tooltip.enabled` | boolean | true | React tooltip overlay. |
| `options.tooltip.hitRadius` | number | 24 | Nearest-point tolerance in CSS pixels. |
| `options.tooltip.formatter` | function | Automatic / unset | Function (hit) => plain text; no HTML injection. |
| `options.tooltip.style` | json | Automatic / unset | React inline-style object; camelCase CSS keys. |
| `options.legend.enabled` | boolean | true | React series-toggle buttons. |
| `options.legend.align` | start / center / end | "center" | Horizontal alignment. |
| `options.legend.style` | json | Automatic / unset | React inline-style object. |
| `options.hiddenSeries` | json | [] | IDs forced hidden, for example ["primary"]. |
| `options.zoom.enabled` | boolean | false | Wheel/keyboard zoom for vertical Cartesian charts. |
| `options.zoom.pan` | boolean | true | Horizontal drag-to-pan when zoom is enabled. |
| `options.zoom.minSpan` | number | Automatic / unset | Minimum viewport width in x-axis units. |
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

- Add series with matching x values for grouped comparisons. barWidth is a pixel cap.
- Vertical Cartesian types can be mixed with other vertical types. Horizontal and vertical families cannot share a chart.

## Performance and Updates

Detailed geometry is not silently sampled. The default limit is 2,000 items per series; aggregate first or explicitly raise performance.maxItems.

Prefer a new data object when values change. In-place changes require invalidateData(data) and a changed dataVersion or ref.redraw(). Changing dataVersion alone does not invalidate cached indexes. The first index and each invalidation cost O(n).

## Interaction and Export

Tooltips and onPointClick use rendered geometry. The legend toggles visible series. Provide accessibility.label and an optional bounded data table.

With zoom.enabled, wheel/+/- zoom x, pointer dragging pans, arrow keys pan, and Home/double-click reset. Escape dismisses the tooltip. Pinch gestures and drag-to-select are not implemented.

Use a React ref for getCanvas(), getFrame(), redraw(), and exportImage(type?, quality?). Image export defaults to PNG and excludes HTML legend/tooltip overlays. See the [ref and callback reference](../../configuration/README.md#callbacks-and-ref-methods).

## Related Charts

- [Bar](../bar/README.md)
- [Stacked Column](../stackedColumn/README.md)
- [Stacked Bar](../stackedBar/README.md)
- [Bullet](../bullet/README.md)
- [Waterfall](../waterfall/README.md)
