import * as API from "../../../../lib/api/api";
import * as Icons from "../../../../assets/icons";
import { GALLERY_DISABLED, ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/globals/flags";
import { createObjectURLFromSvg, openPostPage } from "../../../../utils/dom/links";
import { ClickCodes } from "../../../../types/primitives/enums";
import { Events } from "../../../../lib/globals/events";
import { FavoriteElement } from "./favorite_types";
import { ITEM_CLASS_NAME } from "../../../../utils/dom/dom";
import { Post } from "../../../../types/api/post";
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
  return ON_DESKTOP_DEVICE ? `<img class="download-button utility-button" src=${createObjectURLFromSvg(Icons.DOWNLOAD.replace("FFFFFF", "0075FF"))}>` : "";
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
  public addOrRemoveButton: HTMLImageElement;
  public downloadButton: HTMLImageElement;

  constructor(post: Post) {
    this.root = htmlTemplate.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.root.children[0].children[0] as HTMLImageElement;
    this.addOrRemoveButton = this.root.children[0].children[1] as HTMLImageElement;
    this.downloadButton = this.root.children[0].children[2] as HTMLImageElement;
    this.populateAttributes(post);
    this.setupAddOrRemoveButton(USER_IS_ON_THEIR_OWN_FAVORITES_PAGE);
    this.setupDownloadButton();
    this.openPostInNewTabOnClick();
    this.presetCanvasDimensions(post);
  }

  public get thumbURL(): string {
    return this.image.src;
  }

  private populateAttributes(post: Post): void {
    this.image.src = post.previewURL;
    this.image.classList.add(getContentType(post.tags));
    this.root.id = post.id;
  }

  private setupAddOrRemoveButton(isRemoveButton: boolean): void {
    this.addOrRemoveButton.onmousedown = (event): void => {
      event.stopPropagation();

      if (event.button !== ClickCodes.LEFT) {
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
    this.swapAddOrRemoveButton();
  }

  private addFavorite(): void {
    API.addFavorite(this.root.id);
    this.swapAddOrRemoveButton();
  }

  private swapAddOrRemoveButton(): void {
    const isRemoveButton = this.addOrRemoveButton.classList.contains("remove-favorite-button");

    this.addOrRemoveButton.outerHTML = isRemoveButton ? addFavoriteButtonHTML : removeFavoriteButtonHTML;
    this.addOrRemoveButton = this.root.children[0].children[1] as HTMLImageElement;
    this.setupAddOrRemoveButton(!isRemoveButton);
  }

  private openPostInNewTabOnClick(): void {
    if (!ON_FAVORITES_PAGE) {
      return;
    }

    this.container.onclick = (event): void => {
      if (event.ctrlKey) {
        // ImageUtils.openOriginalImageInNewTab(this.root);
      }
    };
    this.container.addEventListener("mousedown", (event) => {
      if (event.ctrlKey) {
        return;
      }
      const middleClick = event.button === ClickCodes.MIDDLE;
      const leftClick = event.button === ClickCodes.LEFT;
      const shiftClick = leftClick && event.shiftKey;

      if (middleClick || shiftClick || (leftClick && GALLERY_DISABLED)) {
        event.preventDefault();
        openPostPage(this.root.id);
      }
    });
  }

  private presetCanvasDimensions(post: Post): void {
    const canvas = this.root.querySelector("canvas");

    if (canvas === null || post.height === 0 || post.width === 0) {
      return;
    }
    canvas.dataset.size = `${post.width}x${post.height}`;
  }

  private setupDownloadButton(): void {
    this.downloadButton.onclick = (): void => {
    };
  }
}
