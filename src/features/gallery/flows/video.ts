import { GalleryFlow } from "@/features/gallery/flows/flow";

export class GalleryVideoFlow extends GalleryFlow {
  public toggleVideoMute(): void {
    this.context.preferences.gallery.videoMuted.set(!this.context.preferences.gallery.videoMuted.value);
  }

  public setVolume(volume: number): void {
    this.context.preferences.gallery.videoVolume.set(volume);
  }

  public togglePause(event: MouseEvent): void {
    if (event.ctrlKey || !this.view.isOverVideo(event.target)) {
      return;
    }
    event.preventDefault();
    this.view.toggleVideoPause();
  }

  public close(event: MouseEvent): void {
    if (this.view.isOverVideo(event.target)) {
      this.flows.openClose.close();
    }
  }

  public showControls(event: Event): void {
    if (this.view.isOverVideo(event.target)) {
      this.view.showVideoControls();
    }
  }
}
