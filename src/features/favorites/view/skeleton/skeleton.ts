import { FavoritesAspectRatios } from "@/features/favorites/view/skeleton/aspect_ratios";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/app";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { SeededSequence } from "@/lib/collection/seeded_sequence";
import { SkeletonConfig } from "@/config/skeleton_config";

export interface FavoritesSkeletonConfiguration {
  layout: Layout;
}

export interface FavoritesSkeletonDependencies {
  store: LocalKeyedValues;
  randomSource: RandomSource;
}

export class FavoritesSkeleton {
  private readonly aspectRatios: FavoritesAspectRatios;
  private readonly fallbackAspectRatioHeights: SeededSequence;
  private readonly randomSource: RandomSource;
  private items: FavoritesSkeletonItem[];

  constructor({ layout }: FavoritesSkeletonConfiguration, { store, randomSource }: FavoritesSkeletonDependencies) {
    this.aspectRatios = new FavoritesAspectRatios(store);
    this.randomSource = randomSource;
    this.fallbackAspectRatioHeights = new SeededSequence();
    this.items = this.createItems(layout);
  }

  public show(tile: (elements: HTMLElement[]) => void): void {
    if (this.items.length > 0) {
      tile(this.items.map((item) => item.element));
    }
  }

  public collectAspectRatios(thumbs: HTMLElement[]): void {
    if (this.items.length > 0) {
      this.aspectRatios.collect(thumbs);
      this.items = [];
    }
  }

  private createItems(layout: Layout): FavoritesSkeletonItem[] {
    return Array.from(
      { length: SkeletonConfig.defaultItemCount },
      () => new FavoritesSkeletonItem(
        this.randomSource,
        layout,
        this.aspectRatios.getNext(),
        this.fallbackAspectRatioHeights
      )
    );
  }
}
