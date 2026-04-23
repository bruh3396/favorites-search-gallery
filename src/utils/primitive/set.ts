export function intersection<T>(A: Set<T>, B: Set<T>): Set<T> {
  const result = new Set<T>();

  if (A.size === 0 || B.size === 0) {
    return result;
  }

  if (A.size < B.size) {
    for (const a of A) {
      if (B.has(a)) {
        result.add(a);
      }
    }
    return result;
  }

  for (const b of B) {
    if (A.has(b)) {
      result.add(b);
    }
  }
  return result;
}

export function union<T>(A: Set<T>, B: Set<T>): Set<T> {
  const result = new Set(B);

  for (const a of A) {
    result.add(a);
  }
  return result;
}
