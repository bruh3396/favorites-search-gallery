import * as VideoController2 from "./gallery_video_controller2";
import { GalleryAbstractController } from "../gallery_abstract_controller";
import { setupVideoController } from "./gallery_video_controller2";

class VideoController extends GalleryAbstractController {
  constructor() {
    super();
    this.container.id = "video-container";
    setupVideoController(this.container);
  }

  public hide(): void {
    super.hide();
    VideoController2.stopAllVideos();
  }

  public handlePageChange(): void {
    VideoController2.clearVideoSources();
  }

  public handlePageChangeInGallery(): void { }

  public preload(thumbs: HTMLElement[]): void {
    VideoController2.preloadVideoPlayers(thumbs);
  }

  public toggleVideoLooping(value: boolean): void {
    VideoController2.toggleVideoLooping(value);
  }

  public restartVideo(): void {
    VideoController2.restartActiveVideo();
  }

  public toggleVideoPause(): void {
    VideoController2.toggleActiveVideoPause();
  }

  public toggleVideoMute(): void {
    VideoController2.toggleVideoMute();
  }

   protected display(thumb: HTMLElement): Promise<void> {
    return VideoController2.playVideo(thumb);
  }
}

export const GalleryVideoController = new VideoController();
