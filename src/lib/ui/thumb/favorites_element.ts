import { ActionBarDataset, ActionBarSelectors, actionBarHtml, stampActionBarId } from "@/lib/ui/thumb/action_bar";
import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { removeDataset, setDataset, toggleDataset } from "@/utils/browser/dataset";
import { Favorite } from "@/types/favorite";
import { postPageUrl } from "@/lib/remote/url";

let shouldLinkToPostPage = false;
let template: HTMLElement | null = null;

export function configureFavoritesElement(imagusSupportEnabled: boolean, galleryDisabled: boolean, onMobileDevice: boolean, userIsOnTheirOwnFavoritesPage: boolean): void {
  shouldLinkToPostPage = onMobileDevice || imagusSupportEnabled;
  const root = new DOMParser().parseFromString("", "text/html").createElement("div");

  root.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
  const canvas = galleryDisabled ? "" : "<canvas></canvas>";

  root.innerHTML = `
  <a>
    <img decoding="async">
    ${canvas}
    ${actionBarHtml(userIsOnTheirOwnFavoritesPage)}
  </a>
`;
  template = root;
}

export function createBlankThumb(): HTMLElement {
  if (template === null) {
    throw new Error("configureFavoritesElement() must be called before creating elements");
  }
  return template.cloneNode(true) as HTMLElement;
}

export function bindThumb(root: HTMLElement, favorite: Favorite, favorited: boolean): void {
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

  if (shouldLinkToPostPage) {
    container.href = postPageUrl(root.id);
  }
  setThumbFavorited(root, favorited);
}

export function setThumbFavorited(root: HTMLElement, favorited: boolean): void {
  const bar = root.querySelector<HTMLElement>(`.${ActionBarSelectors.bar}`);

  if (bar !== null) {
    toggleDataset(bar, ActionBarDataset.isFavorite, favorited);
  }
}
