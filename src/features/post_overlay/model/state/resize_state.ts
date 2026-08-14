let isCurrentlyResizing = false;

export function isResizing(): boolean {
  return isCurrentlyResizing;
}

export function setResizing(active: boolean): void {
  isCurrentlyResizing = active;
}
