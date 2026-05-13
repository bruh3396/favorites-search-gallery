import * as GalleryVideoController from "./video_controller";
import { GalleryRenderer, VideoControllerCallbacks } from "../../../types/gallery_types";
import { doNothing } from "../../../../../lib/environment/constants";

const root = document.createElement("div");

root.id = "video-container";

export const GalleryVideoRenderer = {
  root,
  render,
  clear,
  reset: GalleryVideoController.clearVideoSources,
  softReset: doNothing,
  preload: GalleryVideoController.preloadVideoPlayers
} satisfies GalleryRenderer;

export const setupVideoRenderer = (callbacks: VideoControllerCallbacks): void => GalleryVideoController.setup(root, callbacks);
export { toggleVideoLooping, restartActiveVideo as restartVideo, toggleActiveVideoPause as toggleVideoPause, toggleVideoMute } from "./video_controller";

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  GalleryVideoController.playVideo(thumb);
}

function clear(): void {
  root.style.visibility = "hidden";
  GalleryVideoController.stopAllVideos();
}
