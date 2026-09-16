import { FavoritesAspectRatios } from "@/features/favorites/view/skeleton/aspect_ratios";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/app";
import { SkeletonConfig } from "@/config/skeleton_config";

export class FavoritesSkeleton {
  private readonly aspectRatios: FavoritesAspectRatios;
  private readonly items: FavoritesSkeletonItem[];
  private readonly itemCount;

  constructor(layout: Layout, itemCount = SkeletonConfig.defaultItemCount) {
    this.aspectRatios = new FavoritesAspectRatios();
    this.itemCount = itemCount;
    this.items = this.createItems(layout);
  }

  public get elements(): HTMLElement[] {
    return this.items.map((item) => item.element);
  }

  public collectAspectRatios(thumbs: HTMLElement[]): void {
    this.aspectRatios.collect(thumbs);
  }

  private createItems(layout: Layout): FavoritesSkeletonItem[] {
    return Array.from(
      { length: this.itemCount },
      () => new FavoritesSkeletonItem(
        layout,
        this.aspectRatios.getNext()
      )
    );
  }
}
