import { MediaExtension } from "@/types/media";
import { favoriteElementTemplate } from "@/features/favorites/types/favorite_element_template";
import { postPageUrl } from "@/lib/remote/url";
import { resolveMediaType } from "@/lib/media/type";
import { setDataset } from "@/utils/browser/dataset";
import { stampActionBarId } from "@/lib/thumb/action_bar";

export class FavoriteElement {
  public readonly root: HTMLElement;
  private readonly container: HTMLAnchorElement;
  private readonly image: HTMLImageElement;

  constructor(id: string, previewUrl: string, tags: string) {
    this.root = favoriteElementTemplate.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.container.children[0] as HTMLImageElement;
    this.populateAttributes(id, previewUrl, tags);
    this.container.href = postPageUrl(this.root.id);
  }

  public get thumbUrl(): string {
    return this.image.src;
  }

  public setAspectRatio(width: number, height: number): void {
    if (width > 0 && height > 0) {
      this.image.style.aspectRatio = `${width} / ${height}`;
    }
  }

  public setExtension(extension: MediaExtension | undefined): void {
    if (extension !== undefined) {
      setDataset(this.root, "extension", extension);
    }
  }

  private populateAttributes(id: string, previewUrl: string, tags: string): void {
    this.image.src = previewUrl;
    setDataset(this.root, "mediaType", resolveMediaType(tags));
    this.root.id = id;
    stampActionBarId(this.root);
  }
}
