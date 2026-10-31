import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDataIndex, invalidateData, sampleIndices, histogram, lowerBound, pointAt } from '../src/data.js';
test('million-point sampling is bounded, preserves a spike and reuses the index', () => {
    const data = { x: Float64Array.from({ length: 1000000 }, (_, index) => index), y: new Float32Array(1000000) };
    data.y[456789] = 900;
    const index = createDataIndex(data);
    const sampled = sampleIndices(data, { budget: 1200 });
    assert.ok(sampled.length <= 1200);
    assert.ok(sampled.includes(456789));
    assert.equal(sampled[0], 0);
    assert.equal(sampled.at(-1), 999999);
    assert.equal(createDataIndex(data), index);
    assert.equal(index.yMax, 900);
});
test('viewport lookup handles duplicate x values and boundary neighbors', () => {
    const data = [[0, 3], [1, 4], [1, 8], [2, 5], [3, 6]];
    assert.equal(lowerBound(data, 1), 1);
    assert.equal(lowerBound(data, 1, true), 3);
    assert.deepEqual(sampleIndices(data, { min: 1, max: 1 }), [0, 1, 2, 3]);
});
test('invalid values, empty series, financial extents and invalidation', () => {
    assert.deepEqual(sampleIndices([]), []);
    const data = [{ x: 0, y: 3, low: -10, high: 12 }, { x: 1, y: null }];
    assert.equal(createDataIndex(data).yMin, -10);
    assert.equal(createDataIndex(data).hasGaps, true);
    data[0].high = 20;
    invalidateData(data);
    assert.equal(createDataIndex(data).yMax, 20);
    assert.equal(pointAt([5], 0).y, 5);
    assert.throws(() => createDataIndex({ x: [1], y: [] }), /equal lengths/);
});
test('unsorted inputs are not binary searched and histogram counts are exact', () => {
    const data = [[3, 3], [1, 1], [2, 2], [4, 4]];
    assert.equal(createDataIndex(data).sorted, false);
    assert.equal(histogram(data, 2).reduce((total, point) => total + point.y, 0), 4);
    assert.throws(() => histogram(data, 0), /bins/);
    assert.throws(() => sampleIndices(data, { budget: 2 }), /budget/);
});
