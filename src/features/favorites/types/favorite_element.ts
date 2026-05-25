import * as FavoritesActions from "../../../lib/remote/rule34/favorites_actions";
import * as Navigator from "../../../lib/remote/rule34/navigator";
import { ADD_FAVORITE_IMAGE_HTML, REMOVE_FAVORITE_IMAGE_HTML } from "../../../assets/images";
import { ClickCode } from "../../../types/input";
import { Events } from "../../../app/channels/events";
import { GALLERY_DISABLED } from "../../../app/context/flags";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment";
import { Post } from "../../../types/api";
import { buildPostPageUrl } from "../../../lib/remote/url/page_url_builder";
import { downloadFromThumb } from "../../../lib/remote/rule34/media_downloader";
import { favoriteElementTemplate } from "./favorite_element_template";
import { resolveMediaType } from "../../../lib/media/media_type_resolver";

export class FavoriteElement {
  public readonly root: HTMLElement;
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
    this.setFavoriteButtonHandler();
    this.presetCanvasDimensions(post);
    this.setupNavigationClick();
  }

  public get thumbUrl(): string {
    return this.image.src;
  }

  private get hasRemoveButton(): boolean {
    return this.favoriteButton.classList.contains("post-action-btn--remove");
  }

  public swapFavoriteButton(): void {
    this.favoriteButton.outerHTML = this.hasRemoveButton ? ADD_FAVORITE_IMAGE_HTML : REMOVE_FAVORITE_IMAGE_HTML;
    this.favoriteButton = this.container.children[1] as HTMLImageElement;
    this.setFavoriteButtonHandler();
  }

  private setFavoriteButtonHandler(): void {
    this.favoriteButton.onmousedown = (event): void => this.handleFavoriteButtonClick(event);
  }

  private setupNavigationClick(): void {
    this.container.href = buildPostPageUrl(this.root.id);

    if (ON_DESKTOP_DEVICE) {
      this.container.onclick = (event: MouseEvent): void => this.handleClick(event);
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

    if (event.button !== ClickCode.Left) {
      return;
    }

    if (this.hasRemoveButton) {
      Events.favorites.favoriteRemoved.emit(this.root.id);
      FavoritesActions.removeFavorite(this.root.id);
    } else {
      Events.favorites.favoriteAdded.emit(this.root.id);
      FavoritesActions.addFavorite(this.root.id);
    }
  }

  private handleClick(event: MouseEvent): void {
    if (event.ctrlKey) {
      Navigator.openMedia(this.root);
    }
    event.preventDefault();
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.ctrlKey) {
      return;
    }
    const shouldOpen = event.button === ClickCode.Middle ||
      (event.button === ClickCode.Left && (event.shiftKey || GALLERY_DISABLED));

    if (shouldOpen) {
      Navigator.openPost(this.root.id);
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
    if (event.button === ClickCode.Left) {
      event.stopPropagation();
      downloadFromThumb(this.root);
    }
  }
}
