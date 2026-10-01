import { FavoritesAspectRatios } from "@/features/favorites/view/skeleton/aspect_ratios";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/app";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { Random } from "@/core/boundary/ports/random";
import { SeededSequence } from "@/lib/collection/seeded_sequence";
import { SkeletonConfig } from "@/config/skeleton_config";

export class FavoritesSkeleton {
  private readonly aspectRatios: FavoritesAspectRatios;
  private readonly fallbackAspectRatioHeights: SeededSequence;
  private readonly random: Random;
  private items: FavoritesSkeletonItem[];
  private readonly itemCount;

  constructor(store: LocalKeyedValues, random: Random, layout: Layout, itemCount = SkeletonConfig.defaultItemCount) {
    this.aspectRatios = new FavoritesAspectRatios(store);
    this.random = random;
    this.fallbackAspectRatioHeights = new SeededSequence();
    this.itemCount = itemCount;
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
      { length: this.itemCount },
      () => new FavoritesSkeletonItem(
        this.random,
        layout,
        this.aspectRatios.getNext(),
        this.fallbackAspectRatioHeights
      )
    );
  }
}
