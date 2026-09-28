import * as GalleryTutorial from "@/features/gallery/view/tutorial";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { Favorite } from "@/types/favorite";
import { AppContext } from "@/app/context/context";
import { BoundaryEdge } from "@/types/boundary";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { GalleryId } from "@/features/gallery/types/selectors";
import { GalleryMenu } from "@/features/gallery/view/menu";
import { GalleryRenderer } from "@/features/gallery/view/rendering/gallery_renderer";
import { GalleryShell } from "@/features/gallery/shell/shell";
import { GalleryUi } from "@/features/gallery/view/ui";
import { GalleryViewDependencies } from "@/features/gallery/types/types";
import { MediaItem } from "@/types/media";
import { Point } from "@/types/geometry";
import { isInside } from "@/utils/browser/guards";
import { queueMacroTask } from "@/lib/async/scheduling";
import { toMediaItem } from "@/lib/ui/thumb/media_item";
import { toggleDisplay } from "@/lib/ui/toggles";
import { viewportWidth } from "@/utils/browser/window";

export class GalleryView {
  private readonly shell: GalleryShell;
  private readonly ui: GalleryUi;
  private readonly menu: GalleryMenu;
  private readonly renderer: GalleryRenderer;

  constructor(context: AppContext, shell: GalleryShell, favoriteFor: (id: string) => Favorite | undefined) {
    this.shell = shell;
    this.ui = new GalleryUi(context.preferences, context.environment, context.shell, shell.background);
    this.menu = new GalleryMenu(context.preferences, context.environment, shell.menu);
    this.renderer = new GalleryRenderer(shell.root, context, favoriteFor);
    GalleryTutorial.mount(shell.tutorial);
  }

  public setup(dependencies: GalleryViewDependencies): void {
    this.renderer.setup(dependencies.onVideoEnded, dependencies.onVolumeChanged);
  }

  public open(): void {
    this.renderer.pauseUpscaler();
    this.shell.root.toggleAttribute("data-visible", true);
    this.ui.open();
  }

  public close(): void {
    this.renderer.resumeUpscaler();
    queueMacroTask(() => this.reUpscale());
    this.shell.root.toggleAttribute("data-visible", false);
    this.renderer.hide();
    this.ui.close();
  }

  public display(item: MediaItem): void {
    this.renderer.render(item);
  }

  public scrollToThumb(id: string): void {
    this.ui.scrollToThumb(id);
  }

  public scrollToThumbAfterLoad(id: string): Promise<void> {
    return this.ui.scrollToThumbAfterLoad(id);
  }

  public showPreview(thumb: HTMLElement): void {
    this.shell.root.toggleAttribute("data-visible", true);
    this.renderer.render(toMediaItem(thumb));
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

  public nudge(item: MediaItem, direction: BoundaryEdge): void {
    this.renderer.nudge(item, direction);
  }

  public contentThumbWidth(): number {
    return this.ui.contentThumbWidth();
  }

  public viewportWidth(): number {
    return viewportWidth();
  }

  public cache(items: MediaItem[]): void {
    this.renderer.cache(items);
  }

  public toggleZoom(value?: boolean): boolean {
    return this.renderer.toggleZoom(value);
  }

  public zoomToPoint(point: Point): void {
    this.renderer.zoomToPoint(point);
  }

  public cacheImages(thumbs: HTMLElement[]): Promise<void> {
    return this.renderer.cacheImages(thumbs);
  }

  public upscale(thumbs: HTMLElement[]): Promise<void> {
    return this.renderer.upscale(thumbs);
  }

  public reUpscale(): void {
    this.renderer.reUpscale();
  }

  public downscaleAll(): void {
    this.renderer.downscaleAll();
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

  public showVideoControls(): void {
    this.renderer.showVideoControls();
  }

  public isVideoFocused(): boolean {
    return this.renderer.isVideoFocused();
  }

  public isOverVideo(target: EventTarget | null): boolean {
    return isInside(target, "#video-container-inner video");
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

  public isOverMenu(target: EventTarget | null): boolean {
    return isInside(target, ".gallery-sub-menu");
  }

  public showTutorial(): void {
    toggleDisplay(this.shell.tutorial, true);
  }

  public hideTutorial(): void {
    toggleDisplay(this.shell.tutorial, false);
  }

  public isOverTutorial(target: EventTarget | null): boolean {
    return isInside(target, `#${GalleryId.tutorial}`);
  }

  public setMenuEnabled(enabled: boolean): void {
    this.menu.setEnabled(enabled);
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
