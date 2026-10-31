# Strata React Charts

A small, canvas-based React chart library with **28 chart types**, typed options,
and indexed sampling for large numeric series. No charting, styling, math, or
utility libraries. Zero runtime dependencies beyond the React peer dependency.
MIT licensed.

[Support this project with a donation](https://www.paypal.me/LibinPrasanth)

**Status: initial 0.1 release.** This is not a drop-in replacement for Highcharts
and does not implement every conceivable visualization. The supported types and
limitations below are the contract. Validate your own data and target devices
before production deployment.

## Compatibility

- React 18 or 19 is the **only peer dependency** and is supplied by your app.
- The published package has **zero `dependencies`**. React cannot itself be
  removed from a React component library.
- Modern browsers with Canvas 2D, ES modules, and Pointer Events. ResizeObserver
  is used when available, with a window-resize fallback.
- Node 18+ for server rendering. ESM package; use `import` or dynamic `import()`.
- TypeScript users need their application's usual React type declarations.

## Install

```sh
npm install @lp-labs/strata-react-charts
```

Install React 18 or 19 in your application if it is not already present. Import
the React component from `@lp-labs/strata-react-charts`, or the React-free renderer
from `@lp-labs/strata-react-charts/core`. No chart stylesheet is required.

## Quick Start

```jsx
import { Chart } from '@lp-labs/strata-react-charts';

const series = [
  { id: 'revenue', name: 'Revenue', data: [18, 24, 21, 32, 29, 42] },
  { id: 'cost', name: 'Cost', data: [12, 14, 17, 19, 20, 23] }
];

export default function RevenueChart() {
  return (
    <Chart
      series={series}
      height={380}
      options={{
        type: 'line',
        title: 'Monthly revenue',
        xAxis: { title: 'Month', formatter: value => String(Math.round(value) + 1) },
        yAxis: { title: 'USD, thousands' },
        zoom: { enabled: true },
        accessibility: { label: 'Revenue and cost by month', table: true }
      }}
      onPointClick={hit => console.log(hit.series.id, hit.index, hit.point)}
    />
  );
}
```

The chart fills its available width. Give percentage heights a parent with an
explicit height. There is no stylesheet to import. With Next.js App Router, use
the React component inside a `'use client'` module. Server rendering emits an
accessible canvas placeholder, legend, and optional table; drawing starts after
mount, without accessing `window` during SSR.

## Data Formats

```js
const indexed = [10, 20, null, 15];
const tuples = [[0, 10], [10, 20], [20, 15]];
const objects = [{ x: 0, y: 10, label: 'North', color: '#087f75' }];
const columns = {
  x: new Float64Array([0, 10, 20]),
  y: new Float32Array([10, 20, 15])
};
```

- `x` defaults to the point index. Time axes accept epoch milliseconds, not Dates.
- `y` is required. `null`, `NaN`, and infinities are missing values.
- Extra object fields: `label`, `color`, `size`, `value`, `low`, `high`, `open`,
  `close`, `q1`, `q3`, `median`, and `total`.
- Column objects can supply the numeric extra fields as arrays/typed arrays.
  All supplied columns should have the same length. String/color/total metadata
  uses object-point input instead.
- Use nondecreasing x values for binary-search viewport filtering. Duplicate x
  values are supported. Unsorted data retains input order and skips binary search;
  sort it before plotting a time series. Sorting is never done behind your back.
- Inputs are not mutated. **Data identity is an immutability contract**: indexes
  are cached in a WeakMap. Prefer a new array/column object for each update.

### Streaming or In-Place Updates

If you deliberately mutate a data buffer, invalidate its index and trigger a
React redraw. Changing `dataVersion` alone does not invalidate cached data.

```jsx
import { invalidateData } from '@lp-labs/strata-react-charts';

data.y[42] = 99;
invalidateData(data);
setVersion(version => version + 1);

// Render with: <Chart series={series} dataVersion={version} />
```

Append-only incremental indexing is not implemented. Reindexing after a mutation
is O(n). Batch stream updates instead of invalidating once per point.

## Supported Charts

Read the [chart configuration guides](docs/charts/README.md) for a separate README
for each chart, including its React example, data fields, supported options,
defaults, and limitations. The [shared configuration reference](docs/configuration/README.md)
documents common settings, component props, callbacks, and ref methods.

Every series has `data`; each point has a representative `y`, including financial
and range points. The extra fields below describe the actual shape.

| Types | Input and behavior |
| --- | --- |
| `line`, `spline`, `step` | Numeric XY series. Spline uses cubic midpoint interpolation; step is horizontal then vertical. |
| `area` | XY line with baseline fill; baseline defaults to zero. |
| `scatter`, `bubble` | XY markers; bubble radius is square root of `size`, default 16, capped by `maxBubbleRadius`. |
| `column`, `bar` | Grouped vertical/horizontal bars. |
| `stackedColumn`, `stackedBar`, `stackedArea` | Stack by matching numeric x, with separate positive/negative accumulators. For stacked area use aligned, sorted x values. |
| `pie`, `donut` | One series; nonpositive values have no sector. `innerRadius` is a fraction for donut. |
| `radar`, `polar` | Evenly spaced categories, shared value scale. Radar polygons; polar sectors. Use nonnegative values or an explicit radial minimum. |
| `heatmap` | `x`, `y` cell center and `value` intensity; `cellWidth`/`cellHeight` are in axis units. Single-hue alpha scale. |
| `treemap` | One flat series, positive values; binary slice layout, not hierarchical squarification. |
| `candlestick`, `ohlc` | `x`, representative `y` (usually close), `low`, `high`, `open`, `close`. |
| `rangeArea`, `rangeBar` | `x`, representative `y`, `low`, `high`. Range bars are vertical. |
| `histogram` | Raw numeric y values; equal-width bins, configured with `series.bins`. Binning is cached and exact. |
| `boxplot` | `x`, representative `y` (usually median), `low`, `high`, `q1`, `q3`, `median`. Precompute statistics. |
| `waterfall` | y increments/decrements; `{ y: value, total: true }` resets to a total. |
| `funnel`, `pyramid` | One positive-valued series; stage heights proportional to values. Funnel widths follow stage values; pyramid widths follow vertical position. |
| `gauge` | One series, first point only; half-circle progress. Value domain defaults to 0..100. |
| `bullet` | Horizontal value bar; `high` is a target marker. |

Mix vertical Cartesian types using `series.type`, such as column and line. Do not
mix horizontal with vertical axes, Cartesian with radial/partition types, or
different radial types. Pie, donut, gauge, treemap, funnel, and pyramid require one
series. Series IDs should be unique and stable. Multi-axis charts are not supported.

## Customization Reference

TypeScript declarations are included for both package entry points. Import types
such as `ChartOptions`, `Series`, `ChartProps`, and `ChartHandle` from the package.
Unknown option keys are not a supported API.

### Chart Options

| Option | Default / purpose |
| --- | --- |
| `type` | `'line'`; series-level type overrides this. |
| `title`, `titleFontSize` | Optional canvas title; title size 18. |
| `background`, `textColor` | White background and restrained green-gray text. |
| `colors` | Eight-color palette; must not be empty. |
| `fontFamily`, `fontSize` | Canvas text font; sans-serif, 12. Fonts must already be loaded by your app. |
| `pixelRatio` | Device pixel ratio; React caps it to 1..4. Core takes its explicit `pixelRatio` argument. |
| `margin` | `{ top, right, bottom, left }` in CSS pixels. Defaults adapt to titles. Increase for long labels. |
| `xAxis`, `yAxis` | `min`, `max`, `title`, `visible`, `color`, `tickCount` (2..20), `formatter(value)`, `categories`, `type: 'linear' \| 'time'`. |
| `grid` | `visible`, `color`, `dash`. Cartesian grid; circular radial grid uses visibility and color. |
| `dataLabels` | `enabled`, `color`, `formatter(point, series)`. Supported on detailed bars/ranges/financial/partitions/radial charts; gauge always displays its value. Dense XY paths omit labels to bound draw work. |
| `tooltip` | `enabled`, `hitRadius` (24 CSS pixels), `formatter(hit)`, React inline `style`. Formatter returns plain text, never injected HTML. |
| `legend` | `enabled`, `align: 'start' \| 'center' \| 'end'`, inline `style`. React legend uses toggle buttons. |
| `hiddenSeries` | Array of IDs (or stringified series indices) forced hidden. |
| `zoom` | `enabled`, `pan` (true), `minSpan` in x-axis units. Cartesian x zoom only, excluding horizontal bar/bullet types. |
| `crosshair` | `enabled`, `color`. Vertical overlay at the current pointer hit. |
| `performance` | `maxPoints` (twice plot width, minimum 4), `maxItems` (2000). See performance section. |
| `accessibility` | `label`, `description`, `table`, `maxRows` (50 per series, capped at 1000). |
| `emptyText` | `'No data'`. |
| `hooks` | `beforeDraw(context, frame)`, `afterDraw(context, frame)` for custom canvas rendering. |

On horizontal charts, `xAxis` configures the category domain drawn vertically and
`yAxis` configures the value domain drawn horizontally. Radial/partition charts do
not render Cartesian axis labels. Radial y limits affect gauge/radar/polar only.
CSS `style` on the component styles its figure, not pixels painted on the canvas.

### Series Options

Common: `id`, `name`, `data`, `type`, `visible`, `color`.

Cartesian style: `lineWidth` (2), `opacity` (1), `dash` ([]). Paths: `markers`
(false), `markerRadius` (3), `connectNulls` (false). Areas: `baseline` (0),
`fillOpacity` (0.2 for area, 0.35 for ranges/stacks, 0.15 for radar). Scatter/bubble:
`markerRadius`, `maxBubbleRadius` (40). Bars: `barWidth` (36-pixel cap).
Pie/donut: `borderWidth` (2), `innerRadius` (0.6). Histogram: `bins` (20, max 10000).
Financial: `upColor`, `downColor`. Heatmap: `cellWidth`/`cellHeight` (1),
`colorMin` (0), `colorMax` (100). Gauge: `lineWidth` controls arc thickness.
Point color overrides series color. Pie/polar/partition points use the palette
unless given a point or series color. Options only apply to their relevant families;
for example, marker options do not change pie sectors.

### Overlay Example

```js
const options = {
  hooks: {
    afterDraw(context, frame) {
      context.save();
      context.strokeStyle = '#db5b39';
      context.setLineDash([6, 4]);
      context.beginPath();
      context.moveTo(frame.plot.left, frame.y(80));
      context.lineTo(frame.plot.right, frame.y(80));
      context.stroke();
      context.restore();
    }
  }
};
```

Hooks run in logical CSS-pixel coordinates. Keep their drawing state isolated with
save/restore. They are responsible for clipping their own overlays.

## Component API and Interactions

Props: `series`, `options`, `width` (100%), `height` (400), `className`, `style`,
`dataVersion`, `onPointClick(hit, pointerEvent)`, `onHover(hitOrNull)`,
`onViewportChange({ min, max } | null)`, `onError(error)`. Other HTML attributes
are forwarded to the outer figure. Rendering errors call `onError` and show an
inline error state rather than silently drawing misleading output.

With zoom enabled: wheel/pointer drag zooms/pans x, double-click resets. Keyboard
`+`/`-` zoom, left/right arrows pan, `Home` resets, and `Escape` dismisses tooltip.
Vertical touch scrolling is retained. Pinch gestures and drag-to-select are not
implemented. Legend buttons are keyboard operable. Tooltips use sampled points;
they do not search every original point. Pie/donut use exact sector hit testing;
partitions use rectangular bounds (funnel bounds approximate trapezoids).

```jsx
import { useRef } from 'react';
import { Chart } from '@lp-labs/strata-react-charts';

function Example({ series }) {
  const chart = useRef(null);
  return (
    <>
      <button onClick={() => chart.current.resetZoom()}>Reset zoom</button>
      <Chart ref={chart} series={series} options={{ zoom: { enabled: true } }} />
    </>
  );
}
```

Ref methods: `getCanvas()`, `getFrame()`, `resetZoom()`, `setViewport(min, max)`,
`redraw()`, `exportImage(type = 'image/png', quality?)`. Export returns a data URL
or null before mount. Legends/tooltips are HTML overlays and are not in the PNG.
Calling `redraw()` does not invalidate data indexes. Reset zoom after replacing a
dataset with a different x range.

## Million-Point Series: What Is Guaranteed

```jsx
const data = {
  y: Float32Array.from({ length: 1_000_000 }, (_, index) => Math.sin(index / 100))
};
const series = [{ id: 'signal', name: 'Signal', data }];

<Chart series={series} options={{
  type: 'line',
  performance: { maxPoints: 2000 },
  zoom: { enabled: true }
}} />;
```

Create large data outside render and keep its identity stable.

1. Initial indexing is **O(n)**, synchronous, and scans data once. It builds
   min/max segment trees and a gap prefix index, cached by data identity.
2. Warm sorted-x viewport lookup is **O(log n)**. Min/max sampling is
   **O(b log n)**, where b is the draw budget. No million-element point-object
   copy or SVG/DOM node list is created.
3. Drawing and tooltip work are bounded by the sampled count **per dense series**,
   not by total input count. Endpoints and each index-bucket's y extrema survive.
   The global y range is cached; zoom does not automatically rescale it.
4. `line`, `spline`, `step`, `area`, `scatter`, and `bubble` use bounded sampling.
   Scatter/bubble sampling preserves y extrema, **not density or bubble-size
   distribution**. It is an approximation, not an analytical aggregation.
5. Detailed charts are **not silently sampled**. The default 2000-item limit
   throws a clear error. Aggregate/category-reduce first, or consciously raise
   `performance.maxItems`. Histogram can accept millions of raw samples because
   it draws its cached bins; the item limit applies to the resulting bin count.
6. Gaps are checked in O(1) from the prefix index, including gaps between sampled
   vertices. At coarse resolutions, a bucket with many gaps can lose entire tiny
   runs; zoom in to inspect them. Do not use reduced paths for exact analytics.

For n points, tree capacity p is the next power of two. Index storage is about
`16 * p + 4 * (n + 1)` bytes plus small metadata, excluding your input and bounded
draw objects. One million points use roughly 20 MiB of index plus 4 MiB for a
Float32 y column (and 8 MiB if you supply a Float64 x column). Memory grows per
series. Indexes are garbage-collectable when their source data is unreachable.

**No fixed frame-rate promise.** Initial indexing can pause the main thread;
hardware, memory, pixel ratio, visible series, and custom hooks affect speed.
For strict latency budgets, preprocess in a Worker and use the headless renderer
with OffscreenCanvas. The React adapter does not automatically create workers.

## Headless / Worker Rendering

The `core` entry point has no React import and works with a Canvas 2D or
OffscreenCanvas 2D context. It paints pixels and returns scales/hits; HTML legend,
tooltip, resize management, and DOM events are the adapter's responsibility.

```js
import { renderChart } from '@lp-labs/strata-react-charts/core';

const ratio = 2;
canvas.width = 1600;
canvas.height = 800;
const frame = renderChart(canvas.getContext('2d'), {
  width: 800, height: 400, pixelRatio: ratio,
  series: [{ data: { y: values } }],
  options: { type: 'line', performance: { maxPoints: 1600 } }
});
const hit = frame.hitTest(200, 150);
```

For a Worker, transfer a **separate** canvas via `transferControlToOffscreen()`
and numeric ArrayBuffers using `postMessage`. Import `core` in the worker and
call `renderChart` there. Do not transfer a canvas already owned by `<Chart>` or
an already-indexed data buffer. Transferred buffers detach on the sender; send
serializable options only (formatter/hook functions cannot be cloned). Feature
detect OffscreenCanvas and provide a main-thread fallback.

Other core exports: `chartTypes`, `defaultColors`, `createDataIndex`,
`invalidateData`, `sampleIndices`, `pointAt`, `histogram`. `sampleIndices` returns
original data indices, not copied points. Treat returned indexes/frame data as
read-only even though runtime freezing is avoided for performance.

## Deliberate Limits

No 3D, geographic maps, Sankey/network/chord layouts, hierarchical sunburst,
logarithmic axes, multiple y axes, stock navigator, automatic animation,
SVG/PDF export, CommonJS build, automatic statistics, built-in theme CSS,
automatic web workers, or automatic label-collision engine. Long axis labels
need a formatter or larger margins. Gauge/pie/partition display is not a generic
replacement for arbitrary specialized charts. Hook drawing can add overlays,
but it does not turn an unsupported chart type into a supported built-in type.

## Support

Support maintenance, documentation, and new chart features with a
[PayPal donation](https://www.paypal.me/LibinPrasanth).

Donations are optional. The package remains MIT licensed and does not require a
donation or commercial license to use. Donation information is also available
through the package's npm funding metadata and `npm fund`.

## License

MIT.

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/).