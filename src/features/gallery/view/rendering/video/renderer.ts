import * as GalleryVideoController from "@/features/gallery/view/rendering/video/video_controller";
import { Renderer } from "@/features/gallery/types/gallery_types";
import { div } from "@/utils/browser/element";

export class GalleryVideoRenderer implements Renderer {
  public readonly root = div("video-container");

  constructor(onVideoEnded: () => void, onVideoDoubleClicked: (event: MouseEvent) => void, onVolumeChanged: (volume: number) => void) {
    GalleryVideoController.setup(this.root, onVideoEnded, onVideoDoubleClicked, onVolumeChanged);
  }

  public render(thumb: HTMLElement): void {
    this.root.style.visibility = "visible";
    GalleryVideoController.playVideo(thumb);
  }

  public hide(): void {
    this.root.style.visibility = "hidden";
    GalleryVideoController.stopAllVideos();
  }

  public cache(thumbs: HTMLElement[]): void {
    GalleryVideoController.preloadVideoPlayers(thumbs);
  }

  public toggleVideoLooping(value: boolean): void {
    GalleryVideoController.toggleVideoLooping(value);
  }

  public restartVideo(): void {
    GalleryVideoController.restartActiveVideo();
  }

  public toggleVideoPause(): void {
    GalleryVideoController.toggleActiveVideoPause();
  }

  public setVideoMuted(muted: boolean): void {
    GalleryVideoController.setVideoMuted(muted);
  }
}
