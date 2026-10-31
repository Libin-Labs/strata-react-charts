const indexes = new WeakMap();
const extentFields = ['y', 'low', 'high', 'open', 'close', 'q1', 'q3', 'median'];
export function dataLength(data) {
    return data && 'y' in data ? data.y.length : (data?.length ?? 0);
}
export function valueAt(data, index, field = 'y') {
    if ('y' in data)
        return field === 'x' ? (data.x?.[index] ?? index) : data[field]?.[index];
    const point = data[index];
    if (field === 'x')
        return Array.isArray(point) ? point[0] : (point?.x ?? index);
    return pointValue(point, field);
}
function pointValue(point, field) {
    if (typeof point === 'number' || point === null)
        return field === 'y' ? point : undefined;
    if (Array.isArray(point))
        return field === 'y' ? point[1] : undefined;
    return point?.[field];
}
export function pointAt(data, index) {
    const point = data[index];
    const result = point && !Array.isArray(point) && typeof point === 'object' ? { ...point } : {};
    for (const field of ['x', ...extentFields, 'size', 'value']) {
        const value = valueAt(data, index, field);
        if (value !== undefined)
            result[field] = value;
    }
    return result;
}
function lesser(data, left, right) {
    if (left < 0)
        return right;
    if (right < 0)
        return left;
    return valueAt(data, left) <= valueAt(data, right) ? left : right;
}
function greater(data, left, right) {
    if (left < 0)
        return right;
    if (right < 0)
        return left;
    return valueAt(data, left) >= valueAt(data, right) ? left : right;
}
function validateColumns(data) {
    const length = dataLength(data);
    if (!Number.isSafeInteger(length) || length < 0 || length > 2 ** 30)
        throw new RangeError('Unsupported data length.');
    if (!('y' in data))
        return;
    for (const field of ['x', ...extentFields, 'size', 'value']) {
        if (data[field] && data[field].length !== length)
            throw new RangeError(`${field} and y columns must have equal lengths.`);
    }
}
function accumulateExtents(state, position, fields) {
    for (const field of fields) {
        const value = valueAt(state.data, position, field);
        if (!Number.isFinite(value))
            continue;
        state.yMin = Math.min(state.yMin, value);
        state.yMax = Math.max(state.yMax, value);
    }
}
function scanData(state) {
    const { data, length, capacity, minimum, maximum, gaps } = state;
    const fields = 'y' in data ? extentFields.filter(field => data[field]) : extentFields;
    let previousX = -Infinity;
    for (let index = 0; index < length; index++) {
        const x = valueAt(data, index, 'x');
        const y = valueAt(data, index);
        gaps[index + 1] = gaps[index] + (!Number.isFinite(x) || !Number.isFinite(y) ? 1 : 0);
        if (!Number.isFinite(x)) {
            state.sorted = false;
            continue;
        }
        if (x < previousX)
            state.sorted = false;
        previousX = x;
        state.xMin = Math.min(state.xMin, x);
        state.xMax = Math.max(state.xMax, x);
        if (Number.isFinite(y))
            minimum[capacity + index] = maximum[capacity + index] = index;
        accumulateExtents(state, index, fields);
    }
    state.hasGaps = gaps[length] > 0;
}
export function createDataIndex(data) {
    if (!data || typeof data !== 'object')
        throw new TypeError('Series data must be an array or column object.');
    const cached = indexes.get(data);
    if (cached)
        return cached;
    validateColumns(data);
    const length = dataLength(data);
    let capacity = 1;
    while (capacity < length)
        capacity *= 2;
    const minimum = new Int32Array(capacity * 2).fill(-1);
    const maximum = new Int32Array(capacity * 2).fill(-1);
    const result = {
        data, length, capacity, minimum, maximum,
        gaps: new Uint32Array(length + 1), sorted: true, hasGaps: false,
        xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity
    };
    scanData(result);
    for (let node = capacity - 1; node > 0; node--) {
        minimum[node] = lesser(data, minimum[node * 2], minimum[node * 2 + 1]);
        maximum[node] = greater(data, maximum[node * 2], maximum[node * 2 + 1]);
    }
    for (const field of ['xMin', 'xMax', 'yMin', 'yMax']) {
        if (!Number.isFinite(result[field]))
            result[field] = field.endsWith('Min') ? 0 : 1;
    }
    indexes.set(data, result);
    return result;
}
export function invalidateData(data) {
    indexes.delete(data);
}
export function lowerBound(data, value, upper = false) {
    let left = 0;
    let right = dataLength(data);
    while (left < right) {
        const middle = Math.floor((left + right) / 2);
        const x = valueAt(data, middle, 'x');
        if (x < value || (upper && x === value))
            left = middle + 1;
        else
            right = middle;
    }
    return left;
}
function extrema(index, start, end) {
    let left = start + index.capacity;
    let right = end + index.capacity;
    let low = -1;
    let high = -1;
    while (left < right) {
        if (left % 2) {
            low = lesser(index.data, low, index.minimum[left]);
            high = greater(index.data, high, index.maximum[left++]);
        }
        if (right % 2) {
            --right;
            low = lesser(index.data, low, index.minimum[right]);
            high = greater(index.data, high, index.maximum[right]);
        }
        left = Math.floor(left / 2);
        right = Math.floor(right / 2);
    }
    return [low, high];
}
export function sampleIndices(data, { min = -Infinity, max = Infinity, budget = 2000 } = {}) {
    if (min > max || Number.isNaN(min) || Number.isNaN(max))
        throw new RangeError('Sample minimum must not exceed maximum.');
    if (!Number.isFinite(budget) || budget < 4)
        throw new RangeError('Sample budget must be at least four.');
    budget = Math.floor(budget);
    const index = createDataIndex(data);
    if (!index.length)
        return [];
    const start = index.sorted ? Math.max(0, lowerBound(data, min) - 1) : 0;
    const end = index.sorted ? Math.min(index.length, lowerBound(data, max, true) + 1) : index.length;
    const count = end - start;
    if (count <= budget)
        return Array.from({ length: count }, (_, offset) => start + offset);
    const result = [start];
    const buckets = Math.max(1, Math.floor((budget - 2) / 2));
    for (let bucket = 0; bucket < buckets; bucket++) {
        const left = start + Math.floor(bucket * count / buckets);
        const right = start + Math.floor((bucket + 1) * count / buckets);
        const pair = extrema(index, left, right).filter(value => value >= 0).sort((first, second) => first - second);
        for (const value of pair)
            if (value > result.at(-1))
                result.push(value);
    }
    if (result.at(-1) !== end - 1)
        result.push(end - 1);
    return result;
}
export function hasGap(index, start, end) {
    if (!index.hasGaps)
        return false;
    return index.gaps[Math.min(index.length, end + 1)] !== index.gaps[Math.max(0, start)];
}
export function histogram(data, binCount = 20) {
    if (!Number.isInteger(binCount) || binCount < 1 || binCount > 10000)
        throw new RangeError('bins must be an integer between 1 and 10000.');
    const index = createDataIndex(data);
    const width = (index.yMax - index.yMin || 1) / binCount;
    const counts = new Uint32Array(binCount);
    for (let position = 0; position < index.length; position++) {
        const value = valueAt(data, position);
        if (Number.isFinite(value))
            counts[Math.min(binCount - 1, Math.floor((value - index.yMin) / width))]++;
    }
    return Array.from(counts, (y, position) => ({ x: index.yMin + (position + 0.5) * width, y }));
}
