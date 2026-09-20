export class PostOverlayResizeState {
  private isCurrentlyResizing = false;

  public isResizing(): boolean {
    return this.isCurrentlyResizing;
  }

  public setResizing(active: boolean): void {
    this.isCurrentlyResizing = active;
  }
}
