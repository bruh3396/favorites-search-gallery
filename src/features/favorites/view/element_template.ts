import { ActionBarDataset, ActionBarSelectors, actionBarHtml, stampActionBarId } from "@/lib/ui/thumb/action_bar";
import { ITEM_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { doNothing } from "@/core/utils/function/function";
import { getImageFromThumb } from "@/lib/ui/thumb/query";

const PLACEHOLDER_ASPECT_RATIO = "1 / 1";

function calculateAspectRatio(favorite: Favorite): string {
  const width = favorite.getMetric("width");
  const height = favorite.getMetric("height");
  return width > 0 && height > 0 ? `${width} / ${height}` : "";
}

export interface FavoritesElementTemplateConfiguration {
  galleryRunning: boolean;
  linksToPostPage: boolean;
  userIsOnTheirOwnFavoritesPage: boolean;
}

export interface FavoritesElementTemplateDependencies {
  postUrl: (id: string) => string;
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

export class FavoritesElementTemplate {
  private readonly linksToPostPage: boolean;
  private readonly postUrl: (id: string) => string;
  private readonly resolvePreviewUrl: (media: Media) => Promise<string>;
  private readonly template: HTMLElement;

  constructor(
    configuration: FavoritesElementTemplateConfiguration,
    dependencies: FavoritesElementTemplateDependencies
  ) {
    const root = new DOMParser().parseFromString("", "text/html").createElement("div");
    const canvas = configuration.galleryRunning ? "<canvas></canvas>" : "";

    this.linksToPostPage = configuration.linksToPostPage;
    this.postUrl = dependencies.postUrl;
    this.resolvePreviewUrl = dependencies.resolvePreviewUrl;
    root.className = `${ITEM_CLASS_NAME} ${TILE_CLASS_NAME}`;
    root.innerHTML = `
  <a>
    <img decoding="async" alt="">
    ${canvas}
    ${actionBarHtml(configuration.userIsOnTheirOwnFavoritesPage)}
  </a>
`;
    this.template = root;
  }

  public createBlankThumb(): HTMLElement {
    return this.template.cloneNode(true) as HTMLElement;
  }

  public bindThumb(root: HTMLElement, favorite: Favorite, favorited: boolean): void {
    const container = root.children[0] as HTMLAnchorElement;
    const image = container.children[0] as HTMLImageElement;

    const isPlaceholder = favorite.media.locator === "";

    image.removeAttribute("src");
    image.style.aspectRatio = isPlaceholder ? PLACEHOLDER_ASPECT_RATIO : calculateAspectRatio(favorite);
    setDataset(root, "mediaKind", favorite.media.kind);
    root.id = favorite.id;
    stampActionBarId(root);
    toggleDataset(root, "newBadge", favorite.isNew);
    toggleDataset(root, "loading", true);

    if (!isPlaceholder) {
      this.showPreview(root, image, favorite);
    }

    if (this.linksToPostPage) {
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
