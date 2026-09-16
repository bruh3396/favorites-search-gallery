import * as Icons from "@/assets/svg/icons";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { Environment } from "@/app/context/environment";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { blurActiveElement } from "@/utils/browser/window";
import { div } from "@/utils/browser/element";
import { insertStyle } from "@/utils/browser/injector";
import { showFullscreenIcon } from "@/features/gallery/dom_tweaks/fullscreen_icon";

export class GalleryUi {
  private readonly environment: Environment;
  private readonly featureBridge: FeatureBridge;
  private readonly shell: Shell;
  private readonly background: HTMLDivElement;
  private lastVisitedThumb: HTMLElement | null = null;

  constructor(preferences: Preferences, environment: Environment, featureBridge: FeatureBridge, shell: Shell) {
    this.environment = environment;
    this.featureBridge = featureBridge;
    this.shell = shell;
    this.background = div("gallery-background");
    this.background.style.opacity = String(preferences.gallery.backgroundOpacity.value);
  }

  public setup(root: HTMLElement): void {
    root.appendChild(this.background);
    this.toggleVideoPointerEvents(false);
    this.toggleGalleryMenuVisibility(false);
  }

  public open(thumb: HTMLElement): void {
    this.setLastVisitedThumb(thumb);
    blurActiveElement();
    this.toggleCursor(true);
    this.toggleBackgroundInteractability(true);
    this.toggleScrollbar(false);
    this.toggleVideoPointerEvents(true);
    this.toggleGalleryMenuVisibility(true);
  }

  public close(): void {
    this.toggleBackgroundInteractability(false);
    this.toggleScrollbar(true);
    this.scrollToLastVisitedThumb();
    this.toggleVideoPointerEvents(false);
    this.toggleCursor(true);
    this.toggleGalleryMenuVisibility(false);
    this.toggleZoomCursor(false);
  }

  public scrollToLastVisitedThumb(): void {
    this.shell.waitForContentThumbsToLoad()
      .then(() => {
        if (this.lastVisitedThumb !== null && this.usingColumnLayout()) {
          this.scrollToThumb(this.lastVisitedThumb);
        }
      });
  }

  public toggleCursor(value: boolean): void {
    this.background.style.cursor = value ? "default" : "none";
  }

  public toggleGalleryMenuVisibility(value: boolean): void {
    insertStyle(`
      #gallery-menu {
        display: ${value ? "flex" : "none"} !important;
      }
      `, "gallery-menu-visibility");
  }

  public toggleZoomCursor(value: boolean): void {
    this.background.classList.toggle("gallery-background--zooming", value);
  }

  public setBackgroundOpacity(opacity: number): void {
    this.background.style.opacity = String(opacity);
  }

  public toggleScrollbar(value: boolean): void {
    const target = this.environment.onMobileDevice ? document.documentElement : document.body;

    target.style.overflowY = value ? "auto" : "hidden";
  }

  public update(thumb: HTMLElement): void {
    this.setLastVisitedThumb(thumb);

    if (this.usingColumnLayout() || this.environment.usingFirefox) {
      return;
    }
    this.scrollToThumb(thumb);
  }

  public showAddedFavoriteStatus(status: AddFavoriteStatus): void {
    const icon = {
      alreadyAdded: Icons.HEART_CHECK,
      success: Icons.HEART_PLUS,
      error: Icons.ERROR,
      loggedOut: Icons.ERROR
    }[status] ?? Icons.ERROR;

    showFullscreenIcon(icon);
  }

  public showRemovedFavoriteStatus(status: RemoveFavoriteStatus): void {
    switch (status) {
      case "success":
        showFullscreenIcon(Icons.HEART_MINUS);
        break;

      case "forbidden":
        showFullscreenIcon(Icons.WARNING, 1_000);
        setTimeout(() => {
          alert("Removing favorites from the gallery is currently disabled.");
        }, 20);
        break;

      default:
        break;
    }
  }

  public setLastVisitedThumb(thumb: HTMLElement): void {
    this.lastVisitedThumb = thumb;
  }

  private usingColumnLayout(): boolean {
    return this.featureBridge.currentLayout() === "column";
  }

  private toggleVideoPointerEvents(value: boolean): void {
    insertStyle(`
      video {
        pointer-events: ${value ? "auto" : "none"}
      }
      `, "gallery-video-pointer-events");
  }

  private toggleBackgroundInteractability(value: boolean): void {
    this.background.classList.toggle("gallery-background--active", value);
  }

  private scrollToThumb(thumb: HTMLElement): void {
    thumb.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
