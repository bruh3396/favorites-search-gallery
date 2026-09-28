import { GalleryFlow, GalleryFlowDependencies } from "@/features/gallery/flows/flow";
import { clamp, roundToTwoDecimalPlaces } from "@/utils/pure/number";
import { GalleryAction } from "@/types/app";
import { toggleFullscreen } from "@/utils/browser/window";
import { vibrate } from "@/utils/browser/haptics";

export class GalleryActionsFlow extends GalleryFlow {
  private readonly handlers: Partial<Record<GalleryAction, () => void>>;

  constructor(dependencies: GalleryFlowDependencies) {
    super(dependencies);
    this.handlers = {
      exit: (): void => this.flows.navigation.close(),
      fullscreen: toggleFullscreen,
      openPost: (): void => this.model.openPost(),
      openOriginal: (): void => this.model.openMedia(),
      download: (): Promise<void> => this.model.download(),
      addFavorite: (): Promise<void> => this.addFavorite(),
      removeFavorite: (): Promise<void> => this.removeFavorite(),
      toggleBackground: (): void => this.toggleBackgroundOpacity(),
      toggleMute: (): void => this.toggleMute(),
      togglePause: (): void => this.togglePause(),
      pin: (): void => this.togglePin(),
      toggleDockPosition: (): void => this.toggleDockPosition()
    };
  }

  public run(action: GalleryAction): void {
    this.handlers[action]?.();
  }

  public adjustBackgroundOpacity(event: WheelEvent): void {
    const opacity = this.context.preferences.gallery.backgroundOpacity;

    opacity.set(roundToTwoDecimalPlaces(clamp(opacity.value - (event.deltaY * 0.0005), 0, 1)));
  }

  public setVolume(volume: number): void {
    this.context.preferences.gallery.videoVolume.set(volume);
  }

  private async addFavorite(): Promise<void> {
    const status = await this.model.addFavorite();

    if (status === "success") {
      this.context.events.app.favoriteAdded.emit(this.model.currentItem().id);

      if (this.context.environment.device === "mobile") {
        vibrate(15);
      }
    }
    this.view.showAddedFavoriteStatus(status);
  }

  private async removeFavorite(): Promise<void> {
    const status = await this.model.removeFavorite();

    if (status === "success") {
      this.context.events.app.favoriteRemoved.emit(this.model.currentItem().id);
    }
    this.view.showRemovedFavoriteStatus(status);
  }

  private toggleBackgroundOpacity(): void {
    const opacity = this.context.preferences.gallery.backgroundOpacity;

    opacity.set(opacity.value < 1 ? 1 : 0);
  }

  private toggleMute(): void {
    this.context.preferences.gallery.videoMuted.set(!this.context.preferences.gallery.videoMuted.value);
  }

  private togglePause(): void {
    if (this.model.isViewingVideo() && !this.view.isVideoFocused()) {
      this.view.toggleVideoPause();
    }
  }

  private togglePin(): void {
    this.context.preferences.gallery.menuPinned.set(!this.context.preferences.gallery.menuPinned.value);
  }

  private toggleDockPosition(): void {
    this.context.preferences.gallery.menuDockedLeft.set(!this.context.preferences.gallery.menuDockedLeft.value);
  }
}
