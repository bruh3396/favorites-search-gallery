import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { MediaExtension, MediaType } from "@/types/media";
import { actionBarHtml, stampActionBarId } from "@/lib/ui/thumb/action_bar";
import { postPageUrl } from "@/lib/remote/url";
import { setDataset } from "@/utils/browser/dataset";

const template: HTMLElement = new DOMParser().parseFromString("", "text/html").createElement("div");

export class FavoritesElement {
  private static shouldLinkToPostPage = false;

  public static configure(imagusSupportEnabled: boolean, galleryDisabled: boolean, onMobileDevice: boolean, userIsOnTheirOwnFavoritesPage: boolean): void {
    FavoritesElement.shouldLinkToPostPage = onMobileDevice || imagusSupportEnabled;
    template.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
    const canvas = galleryDisabled ? "" : "<canvas></canvas>";

    template.innerHTML = `
  <a>
    <img decoding="async">
    ${canvas}
    ${actionBarHtml(userIsOnTheirOwnFavoritesPage)}
  </a>
`;
  }

  public readonly root: HTMLElement;
  private readonly container: HTMLAnchorElement;
  private readonly image: HTMLImageElement;

  constructor(id: string, previewUrl: string, mediaType: MediaType) {
    this.root = template.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.container.children[0] as HTMLImageElement;
    this.populateAttributes(id, previewUrl, mediaType);

    if (FavoritesElement.shouldLinkToPostPage) {
      this.container.href = postPageUrl(this.root.id);
    }
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

  private populateAttributes(id: string, previewUrl: string, mediaType: MediaType): void {
    this.image.src = previewUrl;
    setDataset(this.root, "mediaType", mediaType);
    this.root.id = id;
    stampActionBarId(this.root);
  }
}
