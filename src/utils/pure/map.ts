export function intersectByKey<T>(a: Map<string, T>, b: Map<string, T>): Map<string, T> {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  const result = new Map<string, T>();

  for (const [key, item] of small) {
    if (large.has(key)) {
      result.set(key, item);
    }
  }
  return result;
}
