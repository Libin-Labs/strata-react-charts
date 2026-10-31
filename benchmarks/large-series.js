import { performance } from 'node:perf_hooks';
import { createDataIndex, sampleIndices } from '../src/core.js';
const length = Number(process.env.POINTS ?? 1000000);
if (!Number.isInteger(length) || length < 1 || length > 20000000)
    throw new RangeError('POINTS must be between 1 and 20000000.');
const data = { y: Float64Array.from({ length }, (_, index) => Math.sin(index / 100) * 30 + Math.cos(index / 751)) };
const start = performance.now();
const index = createDataIndex(data);
const indexed = performance.now();
let samples = [];
const iterations = 100;
for (let iteration = 0; iteration < iterations; iteration++) {
    const min = iteration * length / iterations / 2;
    samples = sampleIndices(data, { min, max: min + length / 4, budget: 2000 });
}
const finished = performance.now();
console.table({
    points: length.toLocaleString(),
    'cold index (ms)': (indexed - start).toFixed(2),
    'mean warm viewport sample (ms)': ((finished - indexed) / iterations).toFixed(3),
    'last sampled points': samples.length,
    'input MiB': (data.y.byteLength / 1024 ** 2).toFixed(2),
    'index MiB': ((index.minimum.byteLength + index.maximum.byteLength + index.gaps.byteLength) / 1024 ** 2).toFixed(2)
});
if (samples.length > 2000)
    throw new Error('Sampling exceeded its budget.');
