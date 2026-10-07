import { PaginationSettings } from "@/core/features/favorites/types/pagination";
import { Preference } from "@/core/utils/reactive/preference";
import { batch } from "@/core/utils/reactive/signal";

export interface FavoritesPaginationFlowDependencies {
  paginationSettings: Preference<PaginationSettings>;
  goToFirstPage: () => void;
}

export class FavoritesPaginationFlow {
  constructor(private readonly dependencies: FavoritesPaginationFlowDependencies) { }

  public update(change: Partial<PaginationSettings>): void {
    const { paginationSettings, goToFirstPage } = this.dependencies;
    const current = paginationSettings.peek();
    const settings = { ...current, ...change };

    if (settings.size === current.size && settings.infiniteScroll === current.infiniteScroll) {
      return;
    }
    batch(() => {
      paginationSettings.set(settings);
      goToFirstPage();
    });
  }
}
