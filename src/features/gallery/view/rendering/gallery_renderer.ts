import { isGif, isVideo } from "@/lib/media/media_type";
import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { AppContext } from "@/app/context/context";
import { BoundaryEdge } from "@/types/boundary";
import { GalleryGifRenderer } from "@/features/gallery/view/rendering/gif/renderer";
import { GalleryImageRenderer } from "@/features/gallery/view/rendering/image/renderer";
import { GalleryVideoRenderer } from "@/features/gallery/view/rendering/video/renderer";
import { Point } from "@/types/geometry";
import { Renderer } from "@/features/gallery/types/types";
import { forceReflow } from "@/utils/browser/element";
import { toMediaItem } from "@/lib/ui/thumb/media_item";

export class GalleryRenderer {
  private readonly imageRenderer: GalleryImageRenderer;
  private readonly videoRenderer: GalleryVideoRenderer;
  private readonly gifRenderer: GalleryGifRenderer;
  private readonly renderers: Renderer[];

  constructor(appRoot: HTMLElement, context: AppContext) {
    this.imageRenderer = new GalleryImageRenderer(context.environment, context.preferences, context.shell);
    this.videoRenderer = new GalleryVideoRenderer(context.preferences, context.environment);
    this.gifRenderer = new GalleryGifRenderer(context.environment);
    this.renderers = [this.imageRenderer, this.videoRenderer, this.gifRenderer];
    this.renderers.forEach((renderer) => appRoot.appendChild(renderer.root));
  }

  public setup(
    onVideoEnded: () => void,
    onVideoDoubleClicked: (event: MouseEvent) => void,
    onVolumeChanged: (volume: number) => void
  ): void {
    this.videoRenderer.setup(onVideoEnded, onVideoDoubleClicked, onVolumeChanged);
  }

  public render(thumb: HTMLElement): void {
    this.hide();
    this.resolve(thumb).render(thumb);
  }

  public nudge(thumb: HTMLElement, direction: BoundaryEdge): void {
    const renderer = this.resolve(thumb);

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

  public cache(thumbs: HTMLElement[]): void {
    this.renderers.forEach((renderer) => renderer.cache(thumbs));
  }

  public toggleZoom(value: boolean | undefined): boolean {
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

  public cacheImages(thumbs: HTMLElement[]): Promise<void> {
    return this.imageRenderer.cache(thumbs);
  }

  public upscale(thumbs: HTMLElement[]): Promise<void> {
    return this.imageRenderer.upscale(thumbs);
  }

  public reUpscale(): void {
    this.imageRenderer.reUpscale();
  }

  public downscaleAll(): void {
    this.imageRenderer.downscaleAll();
  }

  public downscaleDetached(): void {
    this.imageRenderer.downscaleDetached();
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

  public setVideoMuted(muted: boolean): void {
    this.videoRenderer.setVideoMuted(muted);
  }

  private resolve(thumb: HTMLElement): Renderer {
    const item = toMediaItem(thumb);
    return isVideo(item) ? this.videoRenderer : isGif(item) ? this.gifRenderer : this.imageRenderer;
  }
}
