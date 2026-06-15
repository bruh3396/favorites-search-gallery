import * as GalleryVideoController from "@/features/gallery/view/rendering/video/video_controller";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";
import { div } from "@/utils/dom/element_factory";

type VideoRenderer = GalleryRenderer & {
  setup: (onVideoEnded: () => void, onVideoDoubleClicked: (event: MouseEvent) => void) => void
}

const root = div("video-container");

export const GalleryVideoRenderer: VideoRenderer = {
  root,
  setup: (onVideoEnded, onVideoDoubleClicked) => GalleryVideoController.setup(root, onVideoEnded, onVideoDoubleClicked),
  render,
  hide,
  cache: GalleryVideoController.preloadVideoPlayers
};
export { toggleVideoLooping, restartActiveVideo as restartVideo, toggleActiveVideoPause as toggleVideoPause, toggleVideoMute } from "@/features/gallery/view/rendering/video/video_controller";

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  GalleryVideoController.playVideo(thumb);
}

function hide(): void {
  root.style.visibility = "hidden";
  GalleryVideoController.stopAllVideos();
}
