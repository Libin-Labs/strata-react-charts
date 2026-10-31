import type { CSSProperties, ForwardRefExoticComponent, HTMLAttributes, PointerEvent, RefAttributes } from 'react';
import type { ChartFrame, ChartOptions, Hit, Series } from './core.js';
export * from './core.js';
export interface Viewport {
    min: number;
    max: number;
}
export interface ChartHandle {
    getCanvas(): HTMLCanvasElement | null;
    getFrame(): ChartFrame | null;
    resetZoom(): void;
    setViewport(min: number, max: number): void;
    redraw(): void;
    exportImage(type?: string, quality?: number): string | null;
}
export interface ChartProps extends Omit<HTMLAttributes<HTMLElement>, 'onError'> {
    series: readonly Series[];
    options?: ChartOptions;
    width?: number | string;
    height?: number | string;
    style?: CSSProperties;
    dataVersion?: string | number;
    onPointClick?: (hit: Hit, event: PointerEvent<HTMLCanvasElement>) => void;
    onHover?: (hit: Hit | null) => void;
    onViewportChange?: (viewport: Viewport | null) => void;
    onError?: (error: unknown) => void;
}
export const Chart: ForwardRefExoticComponent<ChartProps & RefAttributes<ChartHandle>>;
