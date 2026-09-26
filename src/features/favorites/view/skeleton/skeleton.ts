import { FavoritesAspectRatios } from "@/features/favorites/view/skeleton/aspect_ratios";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/app";
import { SeededSequence } from "@/lib/collection/seeded_sequence";
import { SkeletonConfig } from "@/config/skeleton_config";

export class FavoritesSkeleton {
  private readonly aspectRatios: FavoritesAspectRatios;
  private readonly fallbackAspectRatioHeights: SeededSequence;
  private items: FavoritesSkeletonItem[];
  private readonly itemCount;

  constructor(layout: Layout, itemCount = SkeletonConfig.defaultItemCount) {
    this.aspectRatios = new FavoritesAspectRatios();
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
        layout,
        this.aspectRatios.getNext(),
        this.fallbackAspectRatioHeights
      )
    );
  }
}
