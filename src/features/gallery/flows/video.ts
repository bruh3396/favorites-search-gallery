import { GalleryFlow } from "@/features/gallery/flows/flow";

export class GalleryVideoFlow extends GalleryFlow {
  public toggleVideoMute(): void {
    this.context.preferences.gallery.videoMuted.set(!this.context.preferences.gallery.videoMuted.value);
  }

  public setVolume(volume: number): void {
    this.context.preferences.gallery.videoVolume.set(volume);
  }
}
