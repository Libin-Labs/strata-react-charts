export type ChartType = 'line' | 'spline' | 'step' | 'area' | 'stackedArea' | 'column' | 'bar' | 'stackedColumn' | 'stackedBar' | 'scatter' | 'bubble' | 'pie' | 'donut' | 'polar' | 'radar' | 'heatmap' | 'treemap' | 'candlestick' | 'ohlc' | 'rangeArea' | 'rangeBar' | 'histogram' | 'boxplot' | 'waterfall' | 'funnel' | 'pyramid' | 'gauge' | 'bullet';
export type NumericColumn = ReadonlyArray<number | null> | Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray;
export interface Point {
    x?: number;
    y: number | null;
    label?: string;
    color?: string;
    size?: number;
    value?: number;
    low?: number;
    high?: number;
    open?: number;
    close?: number;
    q1?: number;
    q3?: number;
    median?: number;
    total?: boolean;
}
export interface ColumnData {
    x?: NumericColumn;
    y: NumericColumn;
    low?: NumericColumn;
    high?: NumericColumn;
    open?: NumericColumn;
    close?: NumericColumn;
    q1?: NumericColumn;
    q3?: NumericColumn;
    median?: NumericColumn;
    size?: NumericColumn;
    value?: NumericColumn;
}
export type SeriesData = ReadonlyArray<number | null | readonly [
    number,
    number | null
] | Point> | NumericColumn | ColumnData;
export interface Series {
    id?: string;
    name?: string;
    type?: ChartType;
    data: SeriesData;
    color?: string;
    visible?: boolean;
    lineWidth?: number;
    opacity?: number;
    fillOpacity?: number;
    dash?: number[];
    markers?: boolean;
    markerRadius?: number;
    connectNulls?: boolean;
    baseline?: number;
    maxBubbleRadius?: number;
    barWidth?: number;
    borderWidth?: number;
    innerRadius?: number;
    bins?: number;
    upColor?: string;
    downColor?: string;
    cellWidth?: number;
    cellHeight?: number;
    colorMin?: number;
    colorMax?: number;
}
export interface AxisOptions {
    min?: number;
    max?: number;
    visible?: boolean;
    tickCount?: number;
    formatter?: (value: number) => string;
    categories?: readonly string[];
    type?: 'linear' | 'time';
    title?: string;
    color?: string;
}
export interface Plot {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}
export interface Hit {
    series: Series;
    seriesIndex: number;
    index: number;
    point: Point & {
        x: number;
    };
    x: number;
    y: number;
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    sector?: {
        centerX: number;
        centerY: number;
        radius: number;
        inner: number;
        start: number;
        end: number;
    };
}
export interface Scale {
    (value: number): number;
    invert(value: number): number;
}
export interface ChartFrame {
    width: number;
    height: number;
    plot: Plot;
    xDomain: [
        number,
        number
    ];
    yDomain: [
        number,
        number
    ];
    x: Scale;
    y: Scale;
    categoryY: Scale;
    valueX: Scale;
    hits: Hit[];
    hitTest(x: number, y: number, radius?: number): Hit | null;
}
export interface ChartOptions {
    type?: ChartType;
    title?: string;
    titleFontSize?: number;
    colors?: readonly string[];
    background?: string;
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
    pixelRatio?: number;
    margin?: Partial<{
        top: number;
        right: number;
        bottom: number;
        left: number;
    }>;
    xAxis?: AxisOptions;
    yAxis?: AxisOptions;
    grid?: {
        visible?: boolean;
        color?: string;
        dash?: number[];
    };
    hiddenSeries?: readonly string[];
    emptyText?: string;
    performance?: {
        maxPoints?: number;
        maxItems?: number;
    };
    dataLabels?: {
        enabled?: boolean;
        color?: string;
        formatter?: (point: Point, series: Series) => string;
    };
    tooltip?: {
        enabled?: boolean;
        hitRadius?: number;
        formatter?: (hit: Hit) => string;
        style?: Partial<CSSStyleDeclaration> | Record<string, string | number>;
    };
    legend?: {
        enabled?: boolean;
        align?: 'start' | 'center' | 'end';
        style?: Partial<CSSStyleDeclaration> | Record<string, string | number>;
    };
    zoom?: {
        enabled?: boolean;
        pan?: boolean;
        minSpan?: number;
    };
    crosshair?: {
        enabled?: boolean;
        color?: string;
    };
    accessibility?: {
        label?: string;
        description?: string;
        table?: boolean;
        maxRows?: number;
    };
    hooks?: {
        beforeDraw?: (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ChartFrame) => void;
        afterDraw?: (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ChartFrame) => void;
    };
}
export interface DataIndex {
    readonly data: SeriesData;
    readonly length: number;
    readonly capacity: number;
    readonly minimum: Int32Array;
    readonly maximum: Int32Array;
    readonly gaps: Uint32Array;
    readonly sorted: boolean;
    readonly hasGaps: boolean;
    readonly xMin: number;
    readonly xMax: number;
    readonly yMin: number;
    readonly yMax: number;
}
export const chartTypes: readonly ChartType[];
export const defaultColors: readonly string[];
export function createDataIndex(data: SeriesData): DataIndex;
export function invalidateData(data: SeriesData): void;
export function sampleIndices(data: SeriesData, options?: {
    min?: number;
    max?: number;
    budget?: number;
}): number[];
export function pointAt(data: SeriesData, index: number): Point & {
    x: number;
};
export function histogram(data: SeriesData, binCount?: number): Array<{
    x: number;
    y: number;
}>;
export function renderChart(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, configuration: {
    width: number;
    height: number;
    series?: readonly Series[];
    options?: ChartOptions;
    pixelRatio?: number;
}): ChartFrame;
