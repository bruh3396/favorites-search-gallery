import { Environment } from "@/core/boundary/environment";
import { GalleryVideoController } from "@/features/gallery/view/rendering/video/video_controller";
import { PostMedia } from "@/core/domain/post/post";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { Preferences } from "@/app/context/preferences";
import { Renderer } from "@/features/gallery/types/types";
import { div } from "@/utils/browser/element";

export class GalleryVideoRenderer implements Renderer {
  public readonly root = div("video-container");
  private readonly controller: GalleryVideoController;

  constructor(preferences: Preferences, environment: Environment, mediaSource: Pick<MediaSource, "originalUrl">) {
    this.controller = new GalleryVideoController(preferences, environment, mediaSource);
  }

  public setup(onVideoEnded: () => void, onVolumeChanged: (volume: number) => void): void {
    this.controller.setup(this.root, onVideoEnded, onVolumeChanged);
  }

  public render(item: PostMedia): void {
    this.root.style.visibility = "visible";
    this.controller.playVideo(item);
  }

  public hide(): void {
    this.root.style.visibility = "hidden";
    this.controller.stopAllVideos();
  }

  public cache(items: PostMedia[]): void {
    this.controller.preloadVideoPlayers(items);
  }

  public toggleVideoLooping(value: boolean): void {
    this.controller.toggleVideoLooping(value);
  }

  public restartVideo(): void {
    this.controller.restartActiveVideo();
  }

  public toggleVideoPause(): void {
    this.controller.toggleActiveVideoPause();
  }

  public showVideoControls(): void {
    this.controller.showActiveVideoControls();
  }

  public isVideoFocused(): boolean {
    return this.controller.isActiveVideoFocused();
  }

  public setVideoMuted(muted: boolean): void {
    this.controller.setVideoMuted(muted);
  }
}
