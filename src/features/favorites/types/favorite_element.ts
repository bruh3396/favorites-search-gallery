import { Post } from "@/types/api";
import { buildPostPageUrl } from "@/lib/remote/url";
import { favoriteElementTemplate } from "@/features/favorites/types/favorite_element_template";
import { resolveMediaType } from "@/lib/media/type";
import { setDataset } from "@/utils/browser/dataset";
import { stampActionBarId } from "@/lib/thumb/action_bar";

export class FavoriteElement {
  public readonly root: HTMLElement;
  private readonly container: HTMLAnchorElement;
  private readonly image: HTMLImageElement;

  constructor(post: Post) {
    this.root = favoriteElementTemplate.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.container.children[0] as HTMLImageElement;
    this.populateAttributes(post);
    this.container.href = buildPostPageUrl(this.root.id);
  }

  public get thumbUrl(): string {
    return this.image.src;
  }

  public setAspectRatio(width: number, height: number): void {
    if (width > 0 && height > 0) {
      this.image.style.aspectRatio = `${width} / ${height}`;
    }
  }

  private populateAttributes(post: Post): void {
    this.image.src = post.previewURL;
    setDataset(this.root, "mediaType", resolveMediaType(post.tags));
    this.root.id = post.id;
    stampActionBarId(this.root);
    this.setAspectRatio(post.width, post.height);
  }
}
