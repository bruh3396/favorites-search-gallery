import * as FavoritesAPI from "../../../lib/server/fetch/favorites_fetcher";
import { ADD_FAVORITE_IMAGE_HTML, DOWNLOAD_IMAGE_HTML, REMOVE_FAVORITE_IMAGE_HTML } from "../../../assets/images";
import { ON_DESKTOP_DEVICE, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { openOriginal, openPostPage } from "../../../lib/navigator";
import { ClickCode } from "../../../types/input";
import { Events } from "../../../lib/communication/events";
import { GALLERY_DISABLED } from "../../../lib/environment/derived_environment";
import { ITEM_CLASS_NAME } from "../../../lib/dom/thumb";
import { Post } from "../../../types/post";
import { buildPostPageURL } from "../../../lib/server/url/page_url_builder";
import { downloadFromThumb } from "../../../lib/server/fetch/media_downloader";
import { resolveMediaType } from "../../../lib/media/media_resolver";

let template: HTMLElement;

export function buildFavoriteElementTemplate(): void {
  template = new DOMParser().parseFromString("", "text/html").createElement("div");
  template.className = ITEM_CLASS_NAME;
  template.innerHTML = `
        <a>
          <img>
          ${USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? REMOVE_FAVORITE_IMAGE_HTML : ADD_FAVORITE_IMAGE_HTML}
          ${DOWNLOAD_IMAGE_HTML}
          ${GALLERY_DISABLED ? "" : "<canvas></canvas>"}
        </a>
    `;
}

export class FavoriteElement {
  public root: HTMLElement;
  public container: HTMLAnchorElement;
  public image: HTMLImageElement;
  public favoriteButton: HTMLImageElement;
  public downloadButton: HTMLImageElement;

  constructor(post: Post) {
    this.root = template.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.root.children[0].children[0] as HTMLImageElement;
    this.favoriteButton = this.root.children[0].children[1] as HTMLImageElement;
    this.downloadButton = this.root.children[0].children[2] as HTMLImageElement;
    this.downloadButton.onmousedown = this.download.bind(this);
    this.populateAttributes(post);
    this.setupFavoriteButton(USER_IS_ON_THEIR_OWN_FAVORITES_PAGE);
    this.openPostInNewTabOnClick();
    this.presetCanvasDimensions(post);
  }

  public get thumbUrl(): string {
    return this.image.src;
  }

  public swapFavoriteButton(): void {
    const isRemoveButton = this.favoriteButton.classList.contains("remove-favorite-button");

    this.favoriteButton.outerHTML = isRemoveButton ? ADD_FAVORITE_IMAGE_HTML : REMOVE_FAVORITE_IMAGE_HTML;
    this.favoriteButton = this.root.children[0].children[1] as HTMLImageElement;
    this.setupFavoriteButton(!isRemoveButton);
  }

  private populateAttributes(post: Post): void {
    this.image.src = post.previewURL;
    this.image.classList.add(resolveMediaType(post.tags));
    this.root.id = post.id;
  }

  private setupFavoriteButton(isRemoveButton: boolean): void {
    this.favoriteButton.onmousedown = (event): void => {
      event.stopPropagation();

      if (event.button !== ClickCode.LEFT) {
        return;
      }

      if (isRemoveButton) {
        this.removeFavorite();
      } else {
        this.addFavorite();
      }
    };
  }

  private removeFavorite(): void {
    Events.favorites.favoriteRemoved.emit(this.root.id);
    FavoritesAPI.removeFavorite(this.root.id);
    this.swapFavoriteButton();
  }

  private addFavorite(): void {
    FavoritesAPI.addFavorite(this.root.id);
    this.swapFavoriteButton();
  }

  private openPostInNewTabOnClick(): void {
    if (ON_DESKTOP_DEVICE) {
      this.openPostInNewTabOnClickDesktop();
    } else {
      this.openPostInNewTabOnClickMobile();
    }
  }

  private openPostInNewTabOnClickDesktop(): void {
    this.container.href = buildPostPageURL(this.root.id);
    this.container.onclick = (event): void => {
      if (event.ctrlKey) {
        openOriginal(this.root);
      }
      event.preventDefault();
    };
    this.container.addEventListener("mousedown", (event: MouseEvent): void => {
      if (event.ctrlKey) {
        return;
      }
      const middleClick = event.button === ClickCode.MIDDLE;
      const leftClick = event.button === ClickCode.LEFT;
      const shiftClick = leftClick && event.shiftKey;

      if (middleClick || shiftClick || (leftClick && GALLERY_DISABLED)) {
        event.preventDefault();
        openPostPage(this.root.id);
      }
      event.preventDefault();
    });
  }

  private openPostInNewTabOnClickMobile(): void {
    this.container.href = buildPostPageURL(this.root.id);
  }

  private presetCanvasDimensions(post: Post): void {
    const canvas = this.root.querySelector("canvas");

    if (canvas === null || post.height === 0 || post.width === 0) {
      return;
    }
    canvas.dataset.size = `${post.width}x${post.height}`;
  }

  private download(event: MouseEvent): void {
    event.stopPropagation();
    downloadFromThumb(this.root);
  }
}
