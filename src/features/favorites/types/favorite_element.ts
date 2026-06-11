import * as Navigator from "@/lib/remote/rule34/posts/navigation";
import { buildElementTemplate, favoriteElementTemplate } from "@/features/favorites/types/favorite_element_template";
import { ClickCode } from "@/types/input";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Post } from "@/types/api";
import { buildPostPageUrl } from "@/lib/remote/url/page_url_builder";
import { resolveMediaType } from "@/lib/media/type_resolver";
import { setDataset } from "@/utils/dom/attribute";

export function setupFavoriteElement(): void {
  buildElementTemplate();
}

export class FavoriteElement {
  public readonly root: HTMLElement;
  private readonly container: HTMLAnchorElement;
  private readonly image: HTMLImageElement;

  constructor(post: Post) {
    this.root = favoriteElementTemplate.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.container.children[0] as HTMLImageElement;
    this.populateAttributes(post);
    this.presetCanvasDimensions(post);
    this.setupNavigationClick();
  }

  public get thumbUrl(): string {
    return this.image.src;
  }

  public setAspectRatio(width: number, height: number): void {
    if (width > 0 && height > 0) {
      this.image.style.aspectRatio = `${width} / ${height}`;
    }
  }

  private setupNavigationClick(): void {
    const url = buildPostPageUrl(this.root.id);

    this.container.href = url;
    this.container.addEventListener("mouseenter", (): void => {
      this.container.removeAttribute("href");
    });
    this.container.addEventListener("mouseleave", (): void => {
      this.container.href = url;
    });

    if (ON_DESKTOP_DEVICE) {
      this.container.onclick = (event: MouseEvent): void => this.handleClick(event);
      this.container.addEventListener("mousedown", (event): void => this.handleMouseDown(event));
    }
  }

  private populateAttributes(post: Post): void {

    this.image.src = post.previewURL;
    setDataset(this.root, "mediaType", resolveMediaType(post.tags));
    this.root.id = post.id;
    this.setAspectRatio(post.width, post.height);
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
}
