import { GalleryState } from "@/types/app";

export class GalleryStateController {
  private state: GalleryState;

  constructor(previewEnabled: boolean) {
    this.state = previewEnabled ? "preview" : "idle";
  }

  public get currentState(): GalleryState {
    return this.state;
  }

  public get isIdle(): boolean {
    return this.state === "idle";
  }

  public get isShowingPreviews(): boolean {
    return this.state === "preview";
  }

  public get isInGallery(): boolean {
    return this.state === "open";
  }

  public open(): void {
    this.state = "open";
  }

  public close(): void {
    this.state = "idle";
  }

  public preview(value: boolean): void {
    this.state = this.state === "open" ? "open" : value ? "preview" : "idle";
  }
}
