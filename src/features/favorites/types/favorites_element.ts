import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { MediaExtension, MediaType } from "@/types/media";
import { actionBarHtml, stampActionBarId } from "@/lib/ui/thumb/action_bar";
import { postPageUrl } from "@/lib/remote/url";
import { setDataset } from "@/utils/browser/dataset";

export class FavoritesElement {
  private static shouldLinkToPostPage = false;
  private static template: HTMLElement | null = null;

  public static configure(imagusSupportEnabled: boolean, galleryDisabled: boolean, onMobileDevice: boolean, userIsOnTheirOwnFavoritesPage: boolean): void {
    FavoritesElement.shouldLinkToPostPage = onMobileDevice || imagusSupportEnabled;
    const template = new DOMParser().parseFromString("", "text/html").createElement("div");

    template.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
    const canvas = galleryDisabled ? "" : "<canvas></canvas>";

    template.innerHTML = `
  <a>
    <img decoding="async">
    ${canvas}
    ${actionBarHtml(userIsOnTheirOwnFavoritesPage)}
  </a>
`;
    FavoritesElement.template = template;
  }

  public readonly root: HTMLElement;
  private readonly container: HTMLAnchorElement;
  private readonly image: HTMLImageElement;

  constructor(id: string, previewUrl: string, mediaType: MediaType, width: number, height: number, extension: MediaExtension | undefined) {
    if (FavoritesElement.template === null) {
      throw new Error("FavoritesElement.configure() must be called before constructing instances");
    }
    this.root = FavoritesElement.template.cloneNode(true) as HTMLElement;
    this.container = this.root.children[0] as HTMLAnchorElement;
    this.image = this.container.children[0] as HTMLImageElement;
    this.populateAttributes(id, previewUrl, mediaType);
    this.update(width, height, extension);

    if (FavoritesElement.shouldLinkToPostPage) {
      this.container.href = postPageUrl(this.root.id);
    }
  }

  public get thumbUrl(): string {
    return this.image.src;
  }

  public update(width: number, height: number, extension: MediaExtension | undefined): void {
    if (width > 0 && height > 0) {
      this.image.style.aspectRatio = `${width} / ${height}`;
    }

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
