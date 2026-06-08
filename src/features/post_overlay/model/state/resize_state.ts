let resizing = false;

export function isResizing(): boolean {
  return resizing;
}

export function setResizing(active: boolean): void {
  resizing = active;
}
