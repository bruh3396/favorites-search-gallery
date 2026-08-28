export function vibrate(milliseconds: number): void {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(milliseconds);
  }
}
