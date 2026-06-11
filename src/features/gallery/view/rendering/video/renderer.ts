import * as GalleryVideoController from "@/features/gallery/view/rendering/video/video_controller";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";

const root = document.createElement("div");

root.id = "video-container";

export const GalleryVideoRenderer = {
  root,
  render,
  hide,
  clearCache: GalleryVideoController.clearVideoSources,
  cache: GalleryVideoController.preloadVideoPlayers
} satisfies GalleryRenderer;

export const setupVideoRenderer = (onVideoEnded: () => void, onVideoDoubleClicked: (event: MouseEvent) => void): void => GalleryVideoController.setup(root, onVideoEnded, onVideoDoubleClicked);
export { toggleVideoLooping, restartActiveVideo as restartVideo, toggleActiveVideoPause as toggleVideoPause, toggleVideoMute } from "@/features/gallery/view/rendering/video/video_controller";

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  GalleryVideoController.playVideo(thumb);
}

function hide(): void {
  root.style.visibility = "hidden";
  GalleryVideoController.stopAllVideos();
}
