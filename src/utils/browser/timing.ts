export function measure<T>(label: string, work: () => T): T {
  const start = performance.now();
  const result = work();

  console.log(`${label}: ${Math.round(performance.now() - start)}ms`);
  return result;
}
