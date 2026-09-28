import * as GalleryFullscreenIcon from "@/features/gallery/view/fullscreen_icon";
import * as Icons from "@/assets/svg/icons";
import { AddFavoriteResult, RemoveFavoriteResult } from "@/core/boundary/ports/favorites_editor";
import { Environment } from "@/core/boundary/environment";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { blurActiveElement } from "@/utils/browser/window";
import { toggleDataset } from "@/utils/browser/dataset";

export class GalleryUi {
  private readonly environment: Environment;
  private readonly shell: Shell;
  private readonly background: HTMLElement;

  constructor(preferences: Preferences, environment: Environment, shell: Shell, background: HTMLElement) {
    this.environment = environment;
    this.shell = shell;
    this.background = background;
    this.background.style.opacity = String(preferences.gallery.backgroundOpacity.value);
    this.toggleOpenState(false);
  }

  public contentThumbWidth(): number {
    return this.shell.getFirstContentThumb()?.getBoundingClientRect().width ?? 0;
  }

  public open(): void {
    blurActiveElement();
    this.toggleCursor(true);
    this.toggleBackgroundInteractability(true);
    this.toggleScrollbar(false);
    this.toggleOpenState(true);
  }

  public close(): void {
    this.toggleBackgroundInteractability(false);
    this.toggleScrollbar(true);
    this.toggleOpenState(false);
    this.toggleCursor(true);
    this.toggleZoomCursor(false);
  }

  public scrollToThumb(id: string): void {
    this.shell.findThumb(id)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  public async scrollToThumbAfterLoad(id: string): Promise<void> {
    await this.shell.waitForContentThumbsToLoad();
    this.scrollToThumb(id);
  }

  public toggleCursor(value: boolean): void {
    this.background.style.cursor = value ? "default" : "none";
  }

  public toggleZoomCursor(value: boolean): void {
    toggleDataset(this.background, "zooming", value);
  }

  public setBackgroundOpacity(opacity: number): void {
    this.background.style.opacity = String(opacity);
  }

  public toggleScrollbar(value: boolean): void {
    const target = this.environment.device === "mobile" ? document.documentElement : document.body;

    target.style.overflowY = value ? "auto" : "hidden";
  }

  public showAddFavoriteResult(result: AddFavoriteResult): void {
    const icon = {
      alreadyAdded: Icons.HEART_CHECK,
      added: Icons.HEART_PLUS,
      error: Icons.ERROR,
      loggedOut: Icons.ERROR
    }[result] ?? Icons.ERROR;

    GalleryFullscreenIcon.showFullscreenIcon(icon);
  }

  public showRemoveFavoriteResult(result: RemoveFavoriteResult): void {
    switch (result) {
      case "removed":
        GalleryFullscreenIcon.showFullscreenIcon(Icons.HEART_MINUS);
        break;

      case "forbidden":
        GalleryFullscreenIcon.showFullscreenIcon(Icons.WARNING, 1_000);
        setTimeout(() => {
          alert("Removing favorites from the gallery is currently disabled.");
        }, 20);
        break;

      default:
        break;
    }
  }

  private toggleOpenState(value: boolean): void {
    toggleDataset(document.documentElement, "galleryOpen", value);
  }

  private toggleBackgroundInteractability(value: boolean): void {
    toggleDataset(this.background, "active", value);
  }
}
