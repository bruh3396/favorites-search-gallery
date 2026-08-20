import { randomInt, valuesAround } from "@/utils/pure/number";

export function isIndexInBounds<V>(array: V[], index: number): boolean {
  return index >= 0 && index < array.length;
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
