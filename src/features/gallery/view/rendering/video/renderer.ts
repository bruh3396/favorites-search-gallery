import { Environment } from "@/app/context/environment";
import { GalleryVideoController } from "@/features/gallery/view/rendering/video/video_controller";
import { Preferences } from "@/app/context/preferences";
import { Renderer } from "@/features/gallery/types/types";
import { div } from "@/utils/browser/element";

export class GalleryVideoRenderer implements Renderer {
  public readonly root = div("video-container");
  private readonly controller: GalleryVideoController;

  constructor(preferences: Preferences, environment: Environment) {
    this.controller = new GalleryVideoController(preferences, environment);
  }

  public setup(
    onVideoEnded: () => void,
    onVideoDoubleClicked: (event: MouseEvent) => void,
    onVolumeChanged: (volume: number) => void
  ): void {
    this.controller.setup(this.root, onVideoEnded, onVideoDoubleClicked, onVolumeChanged);
  }

  public render(thumb: HTMLElement): void {
    this.root.style.visibility = "visible";
    this.controller.playVideo(thumb);
  }

  public hide(): void {
    this.root.style.visibility = "hidden";
    this.controller.stopAllVideos();
  }

  public cache(thumbs: HTMLElement[]): void {
    this.controller.preloadVideoPlayers(thumbs);
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

  public setVideoMuted(muted: boolean): void {
    this.controller.setVideoMuted(muted);
  }
}
