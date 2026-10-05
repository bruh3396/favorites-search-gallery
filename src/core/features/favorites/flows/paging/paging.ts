import * as Pager from "@/core/features/favorites/flows/paging/pager";
import { FavoritesDependencies, FavoritesIntents } from "@/core/features/favorites/types/favorites";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Direction } from "@/core/contracts/listing";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { Page } from "@/core/features/favorites/types/paging";

type PagingIntents = Pick<FavoritesIntents, "showPage" | "setInfiniteScrollEnabled">;

export interface FavoritesPagingFlowDependencies extends Pick<FavoritesDependencies, "preferences"> {
  model: FavoritesModel;
  canWrap: () => boolean;
}

export class FavoritesPagingFlow implements PagingIntents {
  public readonly page: Readable<Page> = computed(() => this.computePage());
  public readonly posts: Readable<readonly Favorite[]> = computed(() => this.page.value.favorites);

  constructor(private readonly dependencies: FavoritesPagingFlowDependencies) { }

  public showPage(pageNumber: number): void {
    const { model } = this.dependencies;
    const pageCount = Pager.countPages(model.results.peek().matches.length, this.getPager().pageSize);

    model.setPage(Pager.clampPage(pageNumber, pageCount));
  }

  public setInfiniteScrollEnabled(enabled: boolean): void {
    this.dependencies.preferences.isInfiniteScrollEnabled.set(enabled);
    this.showPage(1);
  }

  public advance(direction: Direction): boolean {
    const { model, canWrap } = this.dependencies;
    const { pageNumber, pageCount } = this.page.peek();
    const next = this.getPager().step(pageNumber, direction, { pageCount, canWrap: canWrap() });

    if (next === undefined) {
      return false;
    }
    model.setPage(next);
    return true;
  }

  private computePage(): Page {
    const { matches, pageNumber } = this.dependencies.model.results.value;
    const pager = this.getPager();
    const pageCount = Pager.countPages(matches.length, pager.pageSize);
    const clamped = Pager.clampPage(pageNumber, pageCount);
    return { favorites: pager.slice(matches, clamped), pageNumber: clamped, pageCount };
  }

  private getPager(): Pager.Pager {
    const { resultsPerPage, isInfiniteScrollEnabled } = this.dependencies.preferences;
    return isInfiniteScrollEnabled.value ? Pager.SCROLLING_PAGER : Pager.createNumberedPager(resultsPerPage.value);
  }
}
