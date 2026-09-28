import { ActionBarDataset, ActionBarSelectors, actionBarHtml, stampActionBarId } from "@/lib/ui/thumb/action_bar";
import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { removeDataset, setDataset, toggleDataset } from "@/utils/browser/dataset";
import { Favorite } from "@/types/favorite";
import { getImageFromThumb } from "@/lib/ui/thumb/query";

export class FavoritesElementTemplate {
  private readonly shouldLinkToPostPage;
  private readonly postUrl: (id: string) => string;
  private readonly template: HTMLElement;

  constructor(galleryRunning: boolean, onMobileDevice: boolean, userIsOnTheirOwnFavoritesPage: boolean, postUrl: (id: string) => string) {
    const root = new DOMParser().parseFromString("", "text/html").createElement("div");
    const canvas = galleryRunning ? "<canvas></canvas>" : "";

    // Without the gallery, thumbs link to their post so hover extensions (Imagus) can preview them.
    this.shouldLinkToPostPage = onMobileDevice || !galleryRunning;
    this.postUrl = postUrl;
    root.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
    root.innerHTML = `
  <a>
    <img decoding="async">
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

    image.src = "";
    image.src = favorite.thumbUrl;
    image.style.aspectRatio = post.width > 0 && post.height > 0 ? `${post.width} / ${post.height}` : "";
    setDataset(root, "mediaType", favorite.mediaType);
    root.id = favorite.id;
    stampActionBarId(root);
    toggleDataset(root, "newBadge", favorite.isNew);

    if (favorite.extension === undefined) {
      removeDataset(root, "extension");
    } else {
      setDataset(root, "extension", favorite.extension);
    }

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
}
