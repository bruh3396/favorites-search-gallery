import { getRandomPositiveInteger } from "../primitive/number";

export function indexInBounds<V>(array: V[], index: number): boolean {
  return index >= 0 && index < array.length;
}

export function shuffleArray<V>(array: V[]): V[] {
  let maxIndex = array.length;
  let randomIndex;

  while (maxIndex > 0) {
    randomIndex = getRandomPositiveInteger(maxIndex);
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

export function getNumbersAround(number: number, count: number, min: number, max: number): number[] {
  if (count <= 0) {
    return [];
  }

  if (min > max) {
    return [];
  }

  const numbers = [number];
  let i = 1;

  while (numbers.length < count) {
    const left = number - i;
    const right = number + i;
    const leftInBounds = left >= min && left <= max;
    const rightInBounds = right >= min && right <= max;
    const bothOutOfBounds = !leftInBounds && !rightInBounds;

    if (bothOutOfBounds) {
      break;
    }

    if (leftInBounds) {
      numbers.push(left);
    }

    if (rightInBounds && numbers.length < count) {
      numbers.push(right);
    }
    i += 1;
  }
  return numbers.sort((a, b) => a - b);
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
