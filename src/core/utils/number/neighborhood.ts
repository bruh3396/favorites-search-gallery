export interface Neighborhood<V> {
  isInBounds: (position: number) => boolean;
  at: (position: number) => V;
}

export function getValuesAround<V>(center: number, count: number, { isInBounds, at }: Neighborhood<V>): V[] {
  if (count <= 0 || !isInBounds(center)) {
    return [];
  }
  const result = [at(center)];
  let i = 1;

  while (result.length < count) {
    const left = center - i;
    const right = center + i;
    const isLeftInBounds = isInBounds(left);
    const isRightInBounds = isInBounds(right);

    if (!isLeftInBounds && !isRightInBounds) {
      break;
    }

    if (isLeftInBounds) {
      result.push(at(left));
    }

    if (isRightInBounds && result.length < count) {
      result.push(at(right));
    }
    i += 1;
  }
  return result;
}
