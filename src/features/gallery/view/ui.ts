import * as GalleryFullscreenIcon from "@/features/gallery/view/fullscreen_icon";
import * as Icons from "@/assets/svg/icons";
import { AddFavoriteResult, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Shell } from "@/app/context/shell";
import { blurActiveElement } from "@/utils/browser/window";
import { toggleDataset } from "@/utils/browser/dataset";

const ADD_FAVORITE_ICONS: Record<AddFavoriteResult, string | null> = {
  added: Icons.HEART_PLUS,
  alreadyAdded: Icons.HEART_CHECK,
  loggedOut: Icons.ERROR,
  cancelled: null,
  blocked: null,
  error: Icons.ERROR
};

const REMOVE_FAVORITE_ICONS: Record<RemoveFavoriteResult, string | null> = {
  removed: Icons.HEART_MINUS,
  cancelled: null,
  blocked: null,
  error: null
};

export class GalleryUi {
  private readonly shell: Shell;
  private readonly hostPage: HostPage;
  private readonly background: HTMLElement;

  constructor(shell: Shell, hostPage: HostPage, background: HTMLElement) {
    this.shell = shell;
    this.hostPage = hostPage;
    this.background = background;
    this.toggleOpenState(false);
  }

  public contentThumbWidth(): number {
    return this.shell.getFirstContentThumb()?.getBoundingClientRect().width ?? 0;
  }

  public open(): void {
    blurActiveElement();
    this.toggleCursor(true);
    this.toggleBackgroundInteractability(true);
    this.hostPage.lockScroll();
    this.toggleOpenState(true);
  }

  public close(): void {
    this.toggleBackgroundInteractability(false);
    this.hostPage.unlockScroll();
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

  public lockScroll(): void {
    this.hostPage.lockScroll();
  }

  public unlockScroll(): void {
    this.hostPage.unlockScroll();
  }

  public showAddFavoriteResult(result: AddFavoriteResult): void {
    const icon = ADD_FAVORITE_ICONS[result];

    if (icon !== null) {
      GalleryFullscreenIcon.showFullscreenIcon(icon);
    }
  }

  public showRemoveFavoriteResult(result: RemoveFavoriteResult): void {
    const icon = REMOVE_FAVORITE_ICONS[result];

    if (icon !== null) {
      GalleryFullscreenIcon.showFullscreenIcon(icon);
    }
  }

  private toggleOpenState(value: boolean): void {
    toggleDataset(document.documentElement, "galleryOpen", value);
  }

  private toggleBackgroundInteractability(value: boolean): void {
    toggleDataset(this.background, "active", value);
  }
}
