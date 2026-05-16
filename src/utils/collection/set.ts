export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const result = new Set<T>();

  if (setA.size < setB.size) {
    for (const a of setA) {
      if (setB.has(a)) {
        result.add(a);
      }
    }
    return result;
  }

  for (const b of setB) {
    if (setA.has(b)) {
      result.add(b);
    }
  }
  return result;
}

export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const result = new Set(setB);

  for (const a of setA) {
    result.add(a);
  }
  return result;
}
