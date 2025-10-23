import * as API from "../../../../lib/api/api";
import * as Icons from "../../../../assets/icons";
import { ClickCode, Post } from "../../../../types/common_types";
import { ON_DESKTOP_DEVICE, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/global/flags/intrinsic_flags";
import { createObjectURLFromSvg, openOriginal, openPostPage } from "../../../../utils/dom/links";
import { Events } from "../../../../lib/global/events/events";
import { FavoriteElement } from "./favorite_types";
import { GALLERY_DISABLED } from "../../../../lib/global/flags/derived_flags";
import { ITEM_CLASS_NAME } from "../../../../utils/dom/dom";
import { createPostPageURL } from "../../../../lib/api/api_url";
import { downloadFromThumb } from "../../../../lib/download/downloader";
import { getContentType } from "../../../../utils/primitive/string";

let htmlTemplate: HTMLElement;
let removeFavoriteButtonHTML: string;
let addFavoriteButtonHTML: string;

export function createFavoriteItemHTMLTemplates(): void {
  removeFavoriteButtonHTML = createRemoveFavoriteButtonHTMLTemplate();
  addFavoriteButtonHTML = createAddFavoriteButtonHTMLTemplate();
  createPostHTMLTemplate();
}

function createRemoveFavoriteButtonHTMLTemplate(): string {
  return `<img class="remove-favorite-button utility-button" src=${createObjectURLFromSvg(Icons.HEART_MINUS)}>`;
}

function createAddFavoriteButtonHTMLTemplate(): string {
  return `<img class="add-favorite-button utility-button" src=${createObjectURLFromSvg(Icons.HEART_PLUS)}>`;
}

function createDownloadButtonHTMLTemplate(): string {
  const downloadHTML = `<img class="download-button utility-button" src=${createObjectURLFromSvg(Icons.DOWNLOAD.replace("FFFFFF", "0075FF"))}>`;
  return downloadHTML;
  // return ON_DESKTOP_DEVICE ? downloadHTML : "";
}

function createPostHTMLTemplate(): void {
  htmlTemplate = new DOMParser().parseFromString("", "text/html").createElement("div");
  htmlTemplate.className = ITEM_CLASS_NAME;
  htmlTemplate.innerHTML = `
        <a>
          <img>
          ${USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? removeFavoriteButtonHTML : addFavoriteButtonHTML}
          ${createDownloadButtonHTMLTemplate()}
          ${GALLERY_DISABLED ? "" : "<canvas></canvas>"}
        </a>
    `;
}

export class FavoriteHTMLElement implements FavoriteElement {
  public root: HTMLElement;
  public container: HTMLAnchorElement;
  public image: HTMLImageElement;
  public favoriteButton: HTMLImageElement;
  public downloadButton: HTMLImageElement;

  constructor(post: Post) {
    this.root = htmlTemplate.cloneNode(true) as HTMLElement;
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

  public get thumbURL(): string {
    return this.image.src;
  }

  public swapFavoriteButton(): void {
    const isRemoveButton = this.favoriteButton.classList.contains("remove-favorite-button");

    this.favoriteButton.outerHTML = isRemoveButton ? addFavoriteButtonHTML : removeFavoriteButtonHTML;
    this.favoriteButton = this.root.children[0].children[1] as HTMLImageElement;
    this.setupFavoriteButton(!isRemoveButton);
  }

  private populateAttributes(post: Post): void {
    this.image.src = post.previewURL;
    this.image.classList.add(getContentType(post.tags));
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
    API.removeFavorite(this.root.id);
    this.swapFavoriteButton();
  }

  private addFavorite(): void {
    API.addFavorite(this.root.id);
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
    this.container.onclick = (event): void => {
      if (event.ctrlKey) {
        openOriginal(this.root);
      }
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
    });
  }

  private openPostInNewTabOnClickMobile(): void {
    this.container.href = createPostPageURL(this.root.id);
    // this.container.addEventListener("mousedown", (event): void => {
    //   if (event.target instanceof HTMLImageElement && event.target.classList.contains("utility-button")) {
    //     return;
    //   }

    //   if (!Preferences.mobileGalleryEnabled.value) {
    //     openPostPage(this.root.id);
    //   }
    // });
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
