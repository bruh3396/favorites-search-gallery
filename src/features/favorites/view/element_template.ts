import { ActionBarDataset, ActionBarSelectors, actionBarHtml, stampActionBarId } from "@/lib/ui/thumb/action_bar";
import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { doNothing } from "@/utils/pure/function";
import { getImageFromThumb } from "@/lib/ui/thumb/query";

export class FavoritesElementTemplate {
  private readonly shouldLinkToPostPage;
  private readonly postUrl: (id: string) => string;
  private readonly template: HTMLElement;

  constructor(
    galleryRunning: boolean,
    onMobileDevice: boolean,
    userIsOnTheirOwnFavoritesPage: boolean,
    postUrl: (id: string) => string,
    private readonly resolvePreviewUrl: (media: Media) => Promise<string>
  ) {
    const root = new DOMParser().parseFromString("", "text/html").createElement("div");
    const canvas = galleryRunning ? "<canvas></canvas>" : "";

    // Without the gallery, thumbs link to their post so hover extensions (Imagus) can preview them.
    this.shouldLinkToPostPage = onMobileDevice || !galleryRunning;
    this.postUrl = postUrl;
    root.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
    root.innerHTML = `
  <a>
    <img decoding="async" alt="">
    ${canvas}
    ${actionBarHtml(userIsOnTheirOwnFavoritesPage)}
  </a>
`;
    this.template = root;
  }

  public createBlankThumb(): HTMLElement {
    return this.template.cloneNode(true) as HTMLElement;
  }

  public bindThumb(root: HTMLElement, favorite: Favorite, favorited: boolean): void {
    const { post } = favorite;
    const container = root.children[0] as HTMLAnchorElement;
    const image = container.children[0] as HTMLImageElement;

    image.removeAttribute("src");
    image.style.aspectRatio = post.width > 0 && post.height > 0 ? `${post.width} / ${post.height}` : "";
    setDataset(root, "mediaKind", favorite.media.kind);
    root.id = favorite.id;
    stampActionBarId(root);
    toggleDataset(root, "newBadge", favorite.isNew);
    this.showPreview(root, image, favorite);

    if (this.shouldLinkToPostPage) {
      container.href = this.postUrl(root.id);
    }
    this.setThumbFavorited(root, favorited);
  }

  public blankThumbImage(root: HTMLElement): void {
    getImageFromThumb(root)?.removeAttribute("src");
  }

  public setThumbFavorited(root: HTMLElement, favorited: boolean): void {
    const bar = root.querySelector<HTMLElement>(`.${ActionBarSelectors.bar}`);

    if (bar !== null) {
      toggleDataset(bar, ActionBarDataset.isFavorite, favorited);
    }
  }

  private async showPreview(root: HTMLElement, image: HTMLImageElement, favorite: Favorite): Promise<void> {
    toggleDataset(root, "loading", true);
    const url = await this.resolvePreviewUrl(favorite.media);

    if (root.id !== favorite.id) {
      return;
    }
    image.src = url;
    await image.decode().catch(doNothing);

    if (root.id === favorite.id) {
      toggleDataset(root, "loading", false);
    }
  }
}
