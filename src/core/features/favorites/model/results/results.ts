import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { ResultsState } from "@/core/features/favorites/types/results";

export class FavoritesResults {
  private readonly current = new Signal<ResultsState>({ matches: [], pageNumber: 1 });

  public get state(): Readable<ResultsState> {
    return this.current;
  }

  public replace(matches: Favorite[]): void {
    this.current.value = { matches, pageNumber: 1 };
  }

  public append(matches: Favorite[]): void {
    const state = this.current.peek();

    this.current.value = { ...state, matches: [...state.matches, ...matches] };
  }

  public setPage(pageNumber: number): void {
    const state = this.current.peek();

    if (pageNumber !== state.pageNumber) {
      this.current.value = { ...state, pageNumber };
    }
  }
}
