import { isGif, isVideo } from "@/lib/media/media_type";
import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { AppContext } from "@/app/context/context";
import { BoundaryEdge } from "@/types/boundary";
import { Favorite } from "@/types/favorite";
import { GalleryGifRenderer } from "@/features/gallery/view/rendering/gif/renderer";
import { GalleryImageRenderer } from "@/features/gallery/view/rendering/image/renderer";
import { GalleryVideoRenderer } from "@/features/gallery/view/rendering/video/renderer";
import { PostMedia } from "@/core/domain/post/post";
import { Point } from "@/types/geometry";
import { Renderer } from "@/features/gallery/types/types";
import { forceReflow } from "@/utils/browser/element";

export class GalleryRenderer {
  private readonly imageRenderer: GalleryImageRenderer;
  private readonly videoRenderer: GalleryVideoRenderer;
  private readonly gifRenderer: GalleryGifRenderer;
  private readonly renderers: Renderer[];

  constructor(galleryRoot: HTMLElement, context: AppContext, favoriteFor: (id: string) => Favorite | undefined) {
    this.imageRenderer = new GalleryImageRenderer(context, favoriteFor);
    this.videoRenderer = new GalleryVideoRenderer(context.preferences, context.environment, context.ports.mediaSource);
    this.gifRenderer = new GalleryGifRenderer(context.environment, context.ports.mediaSource);
    this.renderers = [this.imageRenderer, this.videoRenderer, this.gifRenderer];
    this.renderers.forEach((renderer) => galleryRoot.appendChild(renderer.root));
  }

  public setup(onVideoEnded: () => void, onVolumeChanged: (volume: number) => void): void {
    this.videoRenderer.setup(onVideoEnded, onVolumeChanged);
  }

  public render(item: PostMedia): void {
    this.hide();
    this.resolve(item).render(item);
  }

  public nudge(item: PostMedia, direction: BoundaryEdge): void {
    const renderer = this.resolve(item);

    if (renderer === this.videoRenderer) {
      return;
    }
    const rendererRoot = renderer.root;

    removeDataset(rendererRoot, "nudge");
    forceReflow(rendererRoot);
    setDataset(rendererRoot, "nudge", direction);
  }

  public hide(): void {
    this.renderers.forEach((renderer) => renderer.hide());
  }

  public cache(items: PostMedia[]): void {
    this.renderers.forEach((renderer) => renderer.cache(items));
  }

  public toggleZoom(value?: boolean): boolean {
    return this.imageRenderer.toggleZoom(value);
  }

  public toggleZoomCursor(value: boolean): boolean {
    return this.imageRenderer.toggleZoomCursor(value);
  }

  public pauseUpscaler(): void {
    this.imageRenderer.pauseUpscaler();
  }

  public resumeUpscaler(): void {
    this.imageRenderer.resumeUpscaler();
  }

  public zoomToPoint(point: Point): void {
    this.imageRenderer.zoomToPoint(point);
  }

  public cacheImages(items: PostMedia[]): Promise<void> {
    return this.imageRenderer.cache(items);
  }

  public upscale(items: PostMedia[]): Promise<void> {
    return this.imageRenderer.upscale(items);
  }

  public reUpscale(): void {
    this.imageRenderer.reUpscale();
  }

  public downscaleAll(): void {
    this.imageRenderer.downscaleAll();
  }

  public correctOrientation(): void {
    this.imageRenderer.correctOrientation();
  }

  public toggleVideoLooping(value: boolean): void {
    this.videoRenderer.toggleVideoLooping(value);
  }

  public restartVideo(): void {
    this.videoRenderer.restartVideo();
  }

  public toggleVideoPause(): void {
    this.videoRenderer.toggleVideoPause();
  }

  public showVideoControls(): void {
    this.videoRenderer.showVideoControls();
  }

  public isVideoFocused(): boolean {
    return this.videoRenderer.isVideoFocused();
  }

  public setVideoMuted(muted: boolean): void {
    this.videoRenderer.setVideoMuted(muted);
  }

  private resolve(item: PostMedia): Renderer {
    return isVideo(item) ? this.videoRenderer : isGif(item) ? this.gifRenderer : this.imageRenderer;
  }
}
