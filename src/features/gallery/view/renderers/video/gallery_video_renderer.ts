import * as VideoController from "./gallery_video_controller";
import { GalleryBaseRenderer } from "../gallery_base_renderer";
import { setupVideoController } from "./gallery_video_controller";

class VideoRenderer extends GalleryBaseRenderer {
  constructor() {
    super();
    this.container.id = "video-container";
    setupVideoController(this.container);
  }

  public display(thumb: HTMLElement): Promise<void> {
    super.display(thumb);
    return VideoController.playVideo(thumb);
  }

  public hide(): void {
    super.hide();
    VideoController.stopAllVideos();
  }

  public handlePageChange(): void {
    VideoController.clearVideoSources();
  }

  public handlePageChangeInGallery(): void { }

  public preload(thumbs: HTMLElement[]): void {
    VideoController.preloadVideoPlayers(thumbs);
  }

  public toggleVideoLooping(value: boolean): void {
    VideoController.toggleVideoLooping(value);
  }

  public restartVideo(): void {
    VideoController.restartActiveVideo();
  }

  public toggleVideoPause(): void {
    VideoController.toggleActiveVideoPause();
  }

  public toggleVideoMute(): void {
    VideoController.toggleVideoMute();
  }
}

export const GalleryVideoRenderer = new VideoRenderer();
