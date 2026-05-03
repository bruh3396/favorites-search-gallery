import * as FavoritesAPI from "../../../lib/server/fetch/favorites_fetcher";
import { ADD_FAVORITE_IMAGE_HTML, REMOVE_FAVORITE_IMAGE_HTML } from "../../../assets/images";
import { openOriginal, openPostPage } from "../../../lib/navigator";
import { ClickCode } from "../../../types/input";
import { Events } from "../../../lib/communication/events";
import { GALLERY_DISABLED } from "../../../lib/environment/derived_environment";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { Post } from "../../../types/post";
import { buildPostPageURL } from "../../../lib/server/url/page_url_builder";
import { downloadFromThumb } from "../../../lib/server/fetch/media_downloader";
import { favoriteElementTemplate } from "./favorite_element_template";
import { resolveMediaType } from "../../../lib/media/media_type_resolver";

export class FavoriteElement {
  private readonly root: HTMLElement;
  private readonly container: HTMLAnchorElement;
  private readonly image: HTMLImageElement;
  private favoriteButton: HTMLImageElement;
  private downloadButton: HTMLImageElement;

  constructor(post: Post) {
    this.root = favoriteElementTemplate.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.container.children[0] as HTMLImageElement;
    this.favoriteButton = this.container.children[1] as HTMLImageElement;
    this.downloadButton = this.container.children[2] as HTMLImageElement;
    this.populateAttributes(post);
    this.downloadButton.onmousedown = (event): void => this.download(event);
    this.favoriteButton.onmousedown = (event): void => this.handleFavoriteButtonClick(event);
    this.presetCanvasDimensions(post);
    this.setupNavigationClick();
  }

  public get thumbUrl(): string {
    return this.image.src;
  }

  private get hasRemoveButton(): boolean {
    return this.favoriteButton.classList.contains("remove-favorite-button");
  }

  public swapFavoriteButton(): void {
    this.favoriteButton.outerHTML = this.hasRemoveButton ? ADD_FAVORITE_IMAGE_HTML : REMOVE_FAVORITE_IMAGE_HTML;
    this.favoriteButton = this.container.children[1] as HTMLImageElement;
  }

  private setupNavigationClick(): void {
    this.container.href = buildPostPageURL(this.root.id);

    if (ON_DESKTOP_DEVICE) {
      this.container.onclick = (event): void => this.handleClick(event);
      this.container.addEventListener("mousedown", (event): void => this.handleMouseDown(event));
    }
  }

  private populateAttributes(post: Post): void {
    this.image.src = post.previewURL;
    this.image.classList.add(resolveMediaType(post.tags));
    this.root.id = post.id;
  }

  private handleFavoriteButtonClick(event: MouseEvent): void {
    event.stopPropagation();

    if (event.button !== ClickCode.LEFT) {
      return;
    }

    if (this.hasRemoveButton) {
      Events.favorites.favoriteRemoved.emit(this.root.id);
      FavoritesAPI.removeFavorite(this.root.id);
    } else {
      FavoritesAPI.addFavorite(this.root.id);
    }
    this.swapFavoriteButton();
  }

  private handleClick(event: PointerEvent): void {
    if (event.ctrlKey) {
      openOriginal(this.root);
    }
    event.preventDefault();
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.ctrlKey) {
      return;
    }
    const shouldOpen = event.button === ClickCode.MIDDLE ||
      (event.button === ClickCode.LEFT && (event.shiftKey || GALLERY_DISABLED));

    if (shouldOpen) {
      openPostPage(this.root.id);
    }
    event.preventDefault();
  }

  private presetCanvasDimensions(post: Post): void {
    const canvas = this.root.querySelector("canvas");

    if (canvas !== null && post.height > 0 && post.width > 0) {
      canvas.dataset.size = `${post.width}x${post.height}`;
    }
  }

  private download(event: MouseEvent): void {
    event.stopPropagation();
    downloadFromThumb(this.root);
  }
}
