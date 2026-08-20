import * as GalleryVideoController from "@/features/gallery/view/rendering/video/video_controller";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";
import { div } from "@/utils/browser/factory";

type VideoRenderer = GalleryRenderer & {
  setup: (onVideoEnded: () => void, onVideoDoubleClicked: (event: MouseEvent) => void, onVolumeChanged: (volume: number) => void) => void;
}

const root = div("video-container");

export const GalleryVideoRenderer: VideoRenderer = {
  root,
  setup: (onVideoEnded, onVideoDoubleClicked, onVolumeChanged) => GalleryVideoController.setup(root, onVideoEnded, onVideoDoubleClicked, onVolumeChanged),
  render,
  hide,
  cache: GalleryVideoController.preloadVideoPlayers
};
export { toggleVideoLooping, restartActiveVideo as restartVideo, toggleActiveVideoPause as toggleVideoPause, setVideoMuted } from "@/features/gallery/view/rendering/video/video_controller";

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  GalleryVideoController.playVideo(thumb);
}

function hide(): void {
  root.style.visibility = "hidden";
  GalleryVideoController.stopAllVideos();
}
