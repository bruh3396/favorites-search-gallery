export function createWorker(script: string): Worker {
  const blob = new Blob([script], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}
