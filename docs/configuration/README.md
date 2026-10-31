# Shared Chart Configuration

[Chart guides](../charts/README.md) | [Package overview](../../README.md)

This reference lists the full public configuration surface. Options apply only to their documented chart families; each [chart README](../charts/README.md) lists its relevant subset. Library defaults differ from the explicit values used in examples.

Set chart-wide options through options, per-series settings through series entries, and component settings directly on Chart. Series-level type overrides options.type. Object-point color takes precedence where that renderer supports point colors.

## Chart appearance

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.type` | line / spline / step / area / stackedArea / column / bar / stackedColumn / stackedBar / scatter / bubble / pie / donut / polar / radar / heatmap / treemap / candlestick / ohlc / rangeArea / rangeBar / histogram / boxplot / waterfall / funnel / pyramid / gauge / bullet | "line" | Default type for series without their own type. |
| `options.title` | text | Automatic / unset | Canvas title, included in image export. |
| `options.titleFontSize` | number | 18 | Title font size in CSS pixels. |
| `options.colors` | json | Built-in eight-color palette | Nonempty array of CSS colors. |
| `options.background` | color | "#ffffff" | Canvas background color. |
| `options.textColor` | color | Context-dependent: #243d36 or #485653 | Default text color. |
| `options.fontFamily` | text | "sans-serif" | A font already available in the browser. |
| `options.fontSize` | number | 12 | Canvas text size in CSS pixels. |
| `options.pixelRatio` | number | Automatic / unset | Defaults to device ratio; React caps the value at 1..4. |
| `options.emptyText` | text | "No data" | Text when no visible series contains points. |

## Margins and grid

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.margin.top` | number | 20; 56 with a title | Plot margin in CSS pixels. |
| `options.margin.right` | number | 24 | Plot margin in CSS pixels. |
| `options.margin.bottom` | number | 42; 62 with an x-axis title; 20 for radial/partition charts | Plot margin in CSS pixels. |
| `options.margin.left` | number | 64; 82 with a y-axis title; 20 for radial/partition charts | Plot margin in CSS pixels. |
| `options.grid.visible` | boolean | true | Cartesian grid and radial rings. |
| `options.grid.color` | color | "#e5e9e9" | Grid-line color. |
| `options.grid.dash` | json | [] | Canvas dash-length array, for example [4, 3]. |

## X axis

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.xAxis.min` | number | Automatic / unset | Explicit finite lower bound; less than maximum. |
| `options.xAxis.max` | number | Automatic / unset | Explicit finite upper bound; greater than minimum. |
| `options.xAxis.visible` | boolean | true | Cartesian axis ticks and labels. |
| `options.xAxis.tickCount` | number | 5 | Between 2 and 20 intervals. |
| `options.xAxis.formatter` | function | Automatic / unset | Function (numeric value) => string. |
| `options.xAxis.categories` | json | Automatic / unset | Array of strings, indexed by rounded tick value. |
| `options.xAxis.type` | linear / time | "linear" | Time expects epoch milliseconds; logarithmic scales are not implemented. |
| `options.xAxis.title` | text | Automatic / unset | Increase margins for long axis titles. |
| `options.xAxis.color` | color | "#485653" | Tick and axis-title text color. |

## Y axis

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.yAxis.min` | number | Automatic / unset | Explicit finite lower bound; less than maximum. |
| `options.yAxis.max` | number | Automatic / unset | Explicit finite upper bound; greater than minimum. |
| `options.yAxis.visible` | boolean | true | Cartesian axis ticks and labels. |
| `options.yAxis.tickCount` | number | 5 | Between 2 and 20 intervals. |
| `options.yAxis.formatter` | function | Automatic / unset | Function (numeric value) => string. |
| `options.yAxis.categories` | json | Automatic / unset | Array of strings, indexed by rounded tick value. |
| `options.yAxis.type` | linear / time | "linear" | Time expects epoch milliseconds; logarithmic scales are not implemented. |
| `options.yAxis.title` | text | Automatic / unset | Increase margins for long axis titles. |
| `options.yAxis.color` | color | "#485653" | Tick and axis-title text color. |

## Series and line styling

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `series.id` | text | Stringified series index | Unique stable ID used by hiddenSeries and legend toggles. |
| `series.name` | text | Series N | Legend and tooltip label. |
| `series.type` | line / spline / step / area / stackedArea / column / bar / stackedColumn / stackedBar / scatter / bubble / pie / donut / polar / radar / heatmap / treemap / candlestick / ohlc / rangeArea / rangeBar / histogram / boxplot / waterfall / funnel / pyramid / gauge / bullet | options.type | Overrides chart type for this series; incompatible families cannot mix. |
| `series.data` | json | Required | Replace the first series with a JSON array or column object. Leave unchanged to retain generated data. |
| `series.visible` | boolean | true | False hides the series and disables its legend toggle. |
| `series.color` | color | Palette color at series index | Overrides the palette; object-point color takes precedence. |
| `series.lineWidth` | number | 2 | Cartesian strokes, radar lines, or gauge thickness. |
| `series.opacity` | number | 1 | Overall Cartesian/radial series alpha. |
| `series.dash` | json | [] | Cartesian stroke dash-length array. |
| `series.markers` | boolean | false | Show markers on line, spline, step, and area. |
| `series.markerRadius` | number | 3 | Path/scatter marker radius in CSS pixels. |
| `series.connectNulls` | boolean | false | Join valid XY vertices across missing values. |
| `series.fillOpacity` | number | 0.2 area; 0.35 stacked/range area; 0.15 radar | Area, stacked/range area, or radar fill alpha. |
| `series.baseline` | number | 0 | Area fill baseline, clipped to the y domain. |

## Specialized series options

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `series.maxBubbleRadius` | number | 40 | Bubble radius cap in pixels. |
| `series.barWidth` | number | 36 | Bar/category pixel-width cap. |
| `series.borderWidth` | number | 2 | Pie/donut sector separator thickness. |
| `series.innerRadius` | number | 0.6 | Fraction of outer radius; capped at 0.95. |
| `series.bins` | number | 20 | Integer from 1 to 10000; maxItems also applies to bins. |
| `series.upColor` | color | "#087f75" | Candlestick/OHLC close greater than or equal to open. |
| `series.downColor` | color | "#db5b39" | Candlestick/OHLC close below open. |
| `series.cellWidth` | number | 1 | Heatmap width in x-axis units. |
| `series.cellHeight` | number | 1 | Heatmap height in y-axis units. |
| `series.colorMin` | number | 0 | Lower end of the alpha intensity scale. |
| `series.colorMax` | number | 100 | Upper end of the alpha intensity scale. |

## Labels, tooltip, and legend

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
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

## Interaction and performance

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.zoom.enabled` | boolean | false | Wheel/keyboard zoom for vertical Cartesian charts. |
| `options.zoom.pan` | boolean | true | Horizontal drag-to-pan when zoom is enabled. |
| `options.zoom.minSpan` | number | Automatic / unset | Minimum viewport width in x-axis units. |
| `options.crosshair.enabled` | boolean | false | Vertical pointer overlay when a hit is found. |
| `options.crosshair.color` | color | "#718780" | Vertical crosshair stroke. |
| `options.performance.maxPoints` | number | Twice plot width; minimum 4 | Min/max sample budget per dense XY series, at least 4. |
| `options.performance.maxItems` | number | 2000 | Reject detailed inputs above this limit rather than silently sample. |

## Accessibility and drawing hooks

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `options.accessibility.label` | text | options.title or Chart | Accessible name for the figure and canvas. |
| `options.accessibility.description` | text | Generated series summary | Screen-reader chart summary. |
| `options.accessibility.table` | boolean | false | Include a visually hidden, bounded data table. |
| `options.accessibility.maxRows` | number | 50 | Table rows per series, capped at 1000. |
| `options.hooks.beforeDraw` | function | Automatic / unset | Canvas hook (context, frame); keep save/restore balanced. |
| `options.hooks.afterDraw` | function | Automatic / unset | Canvas overlay hook (context, frame). |

## React component props

| Option | Value | Default | Behavior |
| --- | --- | --- | --- |
| `props.width` | text | "100%" | CSS width or numeric pixels; constrained by available space. |
| `props.height` | number | 400 | Chart canvas height in CSS pixels. |
| `props.className` | text | Automatic / unset | Outer figure class. |
| `props.style` | json | Automatic / unset | React style object for the outer figure; not painted canvas pixels. |
| `props.dataVersion` | number | Unset | Triggers redraw; in-place buffer changes also require invalidateData(data). |

## Point Fields

| Field | Contract |
| --- | --- |
| `x` | Numeric coordinate; defaults to point index. Time uses epoch milliseconds. |
| `y` | Required numeric value or null. Use close/median/midpoint as representative y for specialized charts. |
| `label` | Object-point category or tooltip label. |
| `color` | Object-point CSS color override. |
| `size` | Bubble magnitude; radius is its square root. |
| `value` | Heatmap intensity. |
| `low` | Financial/range lower bound or boxplot lower whisker. |
| `high` | Upper bound/whisker, or bullet target. |
| `open` | Financial opening value. |
| `close` | Financial closing value. |
| `q1` | Boxplot lower quartile. |
| `q3` | Boxplot upper quartile. |
| `median` | Boxplot median. |
| `total` | Waterfall total/reset flag. |

## Callbacks and Ref Methods

| API | Contract |
| --- | --- |
| `series` | Required array of Series objects. The playground edits the first series. |
| `options` | ChartOptions object. All supported fields are listed in the reference below. |
| `onPointClick(hit, event)` | Called when a rendered point or shape is selected. |
| `onHover(hit \| null)` | Called on pointer hover and when leaving the chart. |
| `onViewportChange(range \| null)` | Receives { min, max } on zoom/pan, or null on reset. |
| `onError(error)` | Receives rendering failures; the chart also displays an inline error state. |
| `getCanvas()` | Ref method returning the canvas or null before mount. |
| `getFrame()` | Ref method returning the last frame, scales, and hit targets. |
| `resetZoom()` | Ref method that restores the complete x domain. |
| `setViewport(min, max)` | Ref method that sets a bounded x viewport. |
| `redraw()` | Ref method that schedules drawing without invalidating data indexes. |
| `exportImage(type?, quality?)` | Ref method returning a data URL; defaults to image/png. HTML overlays are excluded. |

Use useRef(null) and pass ref to Chart for imperative methods. getCanvas() and getFrame() return null before drawing; exportImage() returns null before mount. Callbacks and hooks are JavaScript functions, not JSON strings. Tooltip formatters return plain text, never injected HTML.

## Configuration Rules

- React 18 or 19 is the only peer dependency; there are no runtime dependencies.
- Both package entry points are ESM and include TypeScript declarations. Import ChartOptions, Series, ChartProps, and ChartHandle from the package when needed.
- Axis limits must be finite and min must be less than max. Time axes accept epoch milliseconds.
- Canvas colors/fonts use browser-supported CSS values; load custom fonts before drawing.
- Keep data immutable by identity, or explicitly invalidateData(data) before triggering a redraw.
- Use stable unique series IDs for hiddenSeries and legend behavior.
- Style the outer figure using the component style prop; canvas styling uses chart/series options.
- Drawing hooks receive logical CSS-pixel coordinates. Keep canvas save/restore balanced and clip overlays yourself.
- Detailed chart families reject inputs above maxItems instead of silently sampling. Dense sampling does not guarantee exact density, bubble size distribution, or analytics.
- Unsupported options such as logarithmic/multiple axes, SVG/PDF export, and automatic workers are not implemented.
