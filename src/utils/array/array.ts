import {getRandomPositiveInteger} from "../primitive/number";

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
