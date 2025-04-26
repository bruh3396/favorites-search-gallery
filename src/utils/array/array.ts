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
