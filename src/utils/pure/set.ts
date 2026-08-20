export function union<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>): Set<T> {
  const result = new Set(setB);

  for (const a of setA) {
    result.add(a);
  }
  return result;
}

export function intersection<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>): Set<T> {
  const smaller = setA.size < setB.size ? setA : setB;
  const larger = smaller === setA ? setB : setA;
  const result = new Set<T>();

  for (const value of smaller) {
    if (larger.has(value)) {
      result.add(value);
    }
  }
  return result;
}

export function hasIntersection<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>): boolean {
  const smaller = setA.size < setB.size ? setA : setB;
  const larger = smaller === setA ? setB : setA;

  for (const value of smaller) {
    if (larger.has(value)) {
      return true;
    }
  }
  return false;
}
