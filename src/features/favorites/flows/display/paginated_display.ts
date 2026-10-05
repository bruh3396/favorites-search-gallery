import { Display } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesView } from "@/features/favorites/view/view";
import { Media } from "@/core/domain/media/media";
import { Milestone } from "@/core/utils/reactive/milestone";
import { NavigationKey } from "@/types/input";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Shell } from "@/app/context/shell";
import { preloadImage } from "@/utils/browser/image";
import { sleep } from "@/lib/async/scheduling";
import { throttle } from "@/lib/async/rate_limiting";

export interface FavoritesPaginatedDisplayDependencies {
  readonly model: FavoritesModel;
  readonly view: FavoritesView;
  readonly favoritesLoaded: Milestone;
  readonly shell: Shell;
  readonly remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl">;
}

export class FavoritesPaginatedDisplay implements Display {
  private readonly model: FavoritesModel;
  private readonly view: FavoritesView;
  private readonly favoritesLoaded: Milestone;
  private readonly shell: Shell;
  private readonly remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl">;
  private hasAppendedFirstResults = false;

  private preloadImages = throttle(async(media: Media[]) => {
    await this.shell.waitForContentThumbsToLoad();

    for (const item of media) {
      await sleep(3);
      preloadImage(await this.remoteMedia.resolvePreviewUrl(item));
    }
  }, 2_000);

  constructor(dependencies: FavoritesPaginatedDisplayDependencies) {
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.favoritesLoaded = dependencies.favoritesLoaded;
    this.shell = dependencies.shell;
    this.remoteMedia = dependencies.remoteMedia;
  }

  public initialize(results: Favorite[]): void {
    this.view.togglePaginator(true);
    this.model.paginate(results);
    this.model.selectPage(1);
    this.renderCurrentPage();
  }

  public sync(): void {
    this.model.paginate(this.model.getCurrentSearchResults());
    this.view.updatePaginator(this.model.paginationContext());
    this.appendMissingThumbsOnCurrentPage();
  }

  public advance(direction: NavigationKey): boolean {
    if (this.favoritesLoaded.reached) {
      if (this.model.selectWrappedAdjacentPage(direction)) {
        this.renderCurrentPage();
        return true;
      }
      return this.model.hasOnlyOnePage();
    }

    if (this.model.selectAdjacentPage(direction)) {
      this.renderCurrentPage();
      return true;
    }
    return false;
  }

  public goToPage(pageNumber: number): void {
    this.model.selectPage(pageNumber);
    this.renderCurrentPage();
  }

  public teardown(): void {
    this.view.togglePaginator(false);
  }

  private renderCurrentPage(): void {
    this.view.showSearchResults(this.model.currentPageFavorites());
    this.view.renderPagination(this.model.paginationContext());
    this.preloadImages(this.model.adjacentPageFavorites().map(favorite => favorite.media));
  }

  private appendMissingThumbsOnCurrentPage(): void {
    if (this.hasAppendedFirstResults && !this.model.atFinalPage()) {
      return;
    }
    const missing = this.model.currentPageFavorites().filter(favorite => !this.shell.hasThumb(favorite.id));

    if (missing.length === 0) {
      return;
    }
    this.hasAppendedFirstResults = true;
    this.view.addToBottom(missing);
  }
}
