import * as VideoController from "./video_controller";
import { GalleryAbstractRenderer } from "../abstract_renderer";
import { VideoControllerCallbacks } from "../../../types/gallery_types";

class VideoRenderer extends GalleryAbstractRenderer {
  constructor() {
    super();
    this.container.id = "video-container";
  }

  public setup(callbacks: VideoControllerCallbacks): void {
    VideoController.setupVideoController(this.container, callbacks);
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

   protected display(thumb: HTMLElement): Promise<void> {
    return VideoController.playVideo(thumb);
  }
}

export const GalleryVideoRenderer = new VideoRenderer();
