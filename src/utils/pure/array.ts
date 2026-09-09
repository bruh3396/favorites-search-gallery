import { randomInt, valuesAround } from "@/utils/pure/number";

export function isIndexInBounds<V>(array: V[], index: number): boolean {
  return index >= 0 && index < array.length;
}

export function findFirstIndexWhere(length: number, satisfiedAt: (index: number) => boolean): number {
  let low = 0;
  let high = length;

  while (low < high) {
    const mid = (low + high) >>> 1;

    if (satisfiedAt(mid)) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}

export function itemsAround<V>(array: V[], startIndex: number, limit: number): V[] {
  return valuesAround(startIndex, limit, index => isIndexInBounds(array, index), index => array[index]);
}

export function wrappedItemsAround<V>(array: V[], startIndex: number, limit: number): V[] {
  if (!isIndexInBounds(array, startIndex) || limit === 0) {
    return [];
  }
  const result = [array[startIndex]];
  let i = 1;

  while (result.length < limit && result.length < array.length) {
    const leftIndex = (startIndex - i + array.length) % array.length;
    const rightIndex = (startIndex + i) % array.length;

    result.push(array[leftIndex]);

    if (result.length < limit && result.length < array.length) {
      result.push(array[rightIndex]);
    }

    i += 1;
  }
  return result;
}

export function shuffleInPlace<V>(array: V[]): V[] {
  let maxIndex = array.length;
  let randomIndex;

  while (maxIndex > 0) {
    randomIndex = randomInt(maxIndex);
    maxIndex -= 1;
    [array[maxIndex], array[randomIndex]] = [array[randomIndex], array[maxIndex]];
  }
  return array;
}

export function intersectSortedNumbers(a: number[], b: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push(a[i]);
      i += 1;
      j += 1;
    } else if (a[i] < b[j]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return result;
}

export function insertSorted(sorted: number[], value: number): void {
  sorted.splice(findFirstIndexWhere(sorted.length, index => sorted[index] >= value), 0, value);
}

export function removeValue(sorted: number[], value: number): void {
  const index = sorted.indexOf(value);

  if (index !== -1) {
    sorted.splice(index, 1);
  }
}

export function chunk<V>(array: V[], chunkSize: number): V[][] {
  const result: V[][] = [];

  if (chunkSize <= 0) {
    return [array];
  }

  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}
