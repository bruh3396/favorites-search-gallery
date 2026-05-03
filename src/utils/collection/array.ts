import { randomInt } from "../number";

export function indexInBounds<V>(array: V[], index: number): boolean {
  return index >= 0 && index < array.length;
}

export function shuffleArray<V>(array: V[]): V[] {
  let maxIndex = array.length;
  let randomIndex;

  while (maxIndex > 0) {
    randomIndex = randomInt(maxIndex);
    maxIndex -= 1;
    [
      array[maxIndex],
      array[randomIndex]
    ] = [
        array[randomIndex],
        array[maxIndex]
      ];
  }
  return array;
}

export function getElementsAroundIndex<V>(array: V[], startIndex: number, limit: number): V[] {
  if (!indexInBounds(array, startIndex) || limit === 0) {
    return [];
  }
  const result = [array[startIndex]];
  let i = 1;

  while (result.length < limit) {
    const leftIndex = startIndex - i;
    const rightIndex = startIndex + i;
    const leftIndexInBounds = indexInBounds(array, leftIndex);
    const rightIndexInBounds = indexInBounds(array, rightIndex);
    const bothIndexesOutOfBounds = !leftIndexInBounds && !rightIndexInBounds;

    if (bothIndexesOutOfBounds) {
      break;
    }

    if (leftIndexInBounds) {
      result.push(array[leftIndex]);
    }

    if (rightIndexInBounds && result.length < limit) {
      result.push(array[rightIndex]);
    }
    i += 1;
  }
  return result;
}

export function getWrappedElementsAroundIndex<V>(array: V[], startIndex: number, limit: number): V[] {
  if (!indexInBounds(array, startIndex) || limit === 0) {
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

export function splitIntoChunks<V>(array: V[], chunkSize: number): V[][] {
  const result: V[][] = [];

  if (chunkSize <= 0) {
    return [array];
  }

  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export function randomElement<V>(array: V[] | string): V | string {
  return array[randomInt(array.length)];
}
