export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
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

export function intersects<T>(setA: Set<T>, setB: Set<T>): boolean {
  const smaller = setA.size < setB.size ? setA : setB;
  const larger = smaller === setA ? setB : setA;

  for (const value of smaller) {
    if (larger.has(value)) {
      return true;
    }
  }
  return false;
}

export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const result = new Set(setB);

  for (const a of setA) {
    result.add(a);
  }
  return result;
}
