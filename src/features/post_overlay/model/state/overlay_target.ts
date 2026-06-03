let currentThumbId: string | null = null;

export function isCurrent(thumbId: string): boolean {
  return thumbId === currentThumbId;
}

export function setCurrent(thumbId: string): void {
  currentThumbId = thumbId;
}

export function clear(): void {
  currentThumbId = null;
}
