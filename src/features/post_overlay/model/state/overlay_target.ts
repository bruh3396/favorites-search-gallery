export class PostOverlayTarget {
  private currentThumbId: string | null = null;

  public isCurrent(thumbId: string): boolean {
    return thumbId === this.currentThumbId;
  }

  public setCurrent(thumbId: string): void {
    this.currentThumbId = thumbId;
  }

  public clear(): void {
    this.currentThumbId = null;
  }
}
