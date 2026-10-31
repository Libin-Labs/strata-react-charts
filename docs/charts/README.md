# Chart Configuration Guides

A separate README for every supported chart type. Each guide includes a complete React example, data fields, applicable series/chart settings, defaults, interaction behavior, and performance limits.

[Package overview](../../README.md) | [Shared configuration](../configuration/README.md)

## Time series

- [Line](line/README.md): Connect observations in input order.
- [Spline](spline/README.md): Smooth an XY series using cubic midpoint interpolation.
- [Step](step/README.md): Show values that remain constant until the next observation.
- [Area](area/README.md): Fill a time series down to a chosen baseline.
- [Stacked Area](stackedArea/README.md): Compare cumulative contributions across aligned observations.

## Comparison

- [Column](column/README.md): Compare categories with grouped vertical bars.
- [Bar](bar/README.md): Compare categories with grouped horizontal bars.
- [Stacked Column](stackedColumn/README.md): Compare total values and contributions using vertical stacks.
- [Stacked Bar](stackedBar/README.md): Compare contributions using horizontal stacks.
- [Bullet](bullet/README.md): Compare a horizontal measured value against a target.
- [Waterfall](waterfall/README.md): Show increments, decrements, and explicit totals.

## Distribution

- [Scatter](scatter/README.md): Inspect relationships between numeric x and y observations.
- [Bubble](bubble/README.md): Add a third magnitude to an XY scatter plot.
- [Histogram](histogram/README.md): Count raw numeric observations in equal-width bins.
- [Boxplot](boxplot/README.md): Compare precomputed distribution summaries.
- [Heatmap](heatmap/README.md): Encode a value as cell color intensity.

## Composition

- [Pie](pie/README.md): Show parts of a positive-valued total.
- [Donut](donut/README.md): Show composition with a central opening.
- [Treemap](treemap/README.md): Compare positive values as rectangular areas.
- [Funnel](funnel/README.md): Compare sequential positive-valued stages.
- [Pyramid](pyramid/README.md): Display positive-valued stages in a pyramid.

## Financial

- [Candlestick](candlestick/README.md): Show open, high, low, and close for each interval.
- [Ohlc](ohlc/README.md): Show interval ranges with opening and closing ticks.
- [Range Area](rangeArea/README.md): Display a band between lower and upper values.
- [Range Bar](rangeBar/README.md): Compare low-to-high intervals using vertical bars.

## Radial

- [Radar](radar/README.md): Compare profiles across equally spaced categories.
- [Polar](polar/README.md): Display categories as equally spaced radial sectors.
- [Gauge](gauge/README.md): Show one value within a half-circle progress range.
