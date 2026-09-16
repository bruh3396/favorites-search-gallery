import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { AppContext } from "@/app/context/context";
import { BoundaryEdge } from "@/types/boundary";
import { EnhancedMouseEvent } from "@/lib/event/input";
import GALLERY_CSS from "@/assets/css/gallery/gallery.css";
import { GalleryMenu } from "@/features/gallery/view/shell/menu";
import { GalleryRenderer } from "@/features/gallery/view/rendering/gallery_renderer";
import { GalleryShell } from "@/features/gallery/view/shell/shell";
import { GalleryUi } from "@/features/gallery/view/shell/ui";
import { GalleryViewDependencies } from "@/features/gallery/types/types";
import { insertStyle } from "@/utils/browser/injector";

export class GalleryView {
  private readonly context: AppContext;
  private readonly shell: GalleryShell;
  private readonly ui: GalleryUi;
  private readonly menu: GalleryMenu;
  private readonly renderer: GalleryRenderer;

  constructor(context: AppContext) {
    this.context = context;
    this.shell = new GalleryShell(context.shell);
    this.ui = new GalleryUi(context.preferences, context.environment, context.featureBridge, context.shell);
    this.menu = new GalleryMenu(context.preferences, context.environment);
    this.renderer = new GalleryRenderer(this.shell.root, context);
  }

  public setup(dependencies: GalleryViewDependencies): void {
    insertStyle(GALLERY_CSS);
    this.shell.mountGallery();
    this.ui.setup(this.shell.root);
    this.renderer.setup(dependencies.onVideoEnded, dependencies.onVideoDoubleClicked, dependencies.onVolumeChanged);
    this.menu.setup(this.shell.root, dependencies.onMenuAction);
  }

  public open(thumb: HTMLElement): void {
    this.shell.root.toggleAttribute("data-visible", true);
    this.renderer.toggleUpscaler(true);
    this.ui.open(thumb);
  }

  public close(): void {
    this.renderer.toggleUpscaler(false);
    this.shell.root.toggleAttribute("data-visible", false);
    this.renderer.hide();
    this.ui.close();
    this.renderer.upscaleCachedThumbs();
  }

  public display(thumb: HTMLElement): void {
    this.renderer.render(thumb);
    this.ui.update(thumb);
  }

  public showPreview(thumb: HTMLElement): void {
    this.shell.root.toggleAttribute("data-visible", true);
    this.renderer.render(thumb);
    this.renderer.toggleZoom(false);
    this.ui.toggleScrollbar(false);
  }

  public hidePreview(): void {
    this.shell.root.toggleAttribute("data-visible", false);
    this.renderer.hide();
    this.ui.toggleScrollbar(true);
  }

  public toggleZoomCursor(value: boolean): void {
    this.ui.toggleZoomCursor(value);
    this.renderer.toggleZoomCursor(value);
  }

  public nudge(thumb: HTMLElement, direction: BoundaryEdge): void {
    this.renderer.nudge(thumb, direction);
  }

  public cache(thumbs: HTMLElement[]): void {
    this.renderer.cache(thumbs);
  }

  public toggleZoom(value: boolean | undefined): boolean {
    return this.renderer.toggleZoom(value);
  }

  public zoomToPoint(x: number, y: number): void {
    this.renderer.zoomToPoint(x, y);
  }

  public cacheImages(thumbs: HTMLElement[]): Promise<void> {
    return this.renderer.cacheImages(thumbs);
  }

  public upscale(thumbs: HTMLElement[]): Promise<void> {
    return this.renderer.upscale(thumbs);
  }

  public upscaleCachedThumbs(): void {
    this.renderer.upscaleCachedThumbs();
  }

  public downscaleAll(): void {
    this.renderer.downscaleAll();
  }

  public reupscaleCachedThumbs(): void {
    this.renderer.reupscaleCachedThumbs();
  }

  public correctOrientation(): void {
    this.renderer.correctOrientation();
  }

  public toggleVideoLooping(value: boolean): void {
    this.renderer.toggleVideoLooping(value);
  }

  public restartVideo(): void {
    this.renderer.restartVideo();
  }

  public toggleVideoPause(): void {
    this.renderer.toggleVideoPause();
  }

  public setVideoMuted(muted: boolean): void {
    this.renderer.setVideoMuted(muted);
  }

  public revealMenu(): void {
    this.menu.reveal();
  }

  public toggleMenuPersistence(event: EnhancedMouseEvent): void {
    this.menu.togglePersistence(event);
  }

  public setMenuPinned(pinned: boolean): void {
    this.menu.setPinned(pinned);
  }

  public setMenuDockedLeft(dockedLeft: boolean): void {
    this.menu.setDockedLeft(dockedLeft);
  }

  public toggleCursor(value: boolean): void {
    this.ui.toggleCursor(value);
  }

  public setBackgroundOpacity(opacity: number): void {
    this.ui.setBackgroundOpacity(opacity);
  }

  public showAddedFavoriteStatus(status: AddFavoriteStatus): void {
    this.ui.showAddedFavoriteStatus(status);
  }

  public showRemovedFavoriteStatus(status: RemoveFavoriteStatus): void {
    this.ui.showRemovedFavoriteStatus(status);
  }

  public showCursor(): void {
    this.ui.toggleCursor(true);
  }

  public appendToGallery(element: HTMLElement): HTMLElement {
    return this.shell.root.appendChild(element);
  }
}
