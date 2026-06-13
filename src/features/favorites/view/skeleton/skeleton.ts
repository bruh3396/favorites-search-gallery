import * as FavoritesAspectRatios from "@/features/favorites/view/skeleton/aspect_ratios";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/ui";
import { Preferences } from "@/app/context/preferences";
import { SkeletonConfig } from "@/config/skeleton_config";
import { getLayout } from "@/app/layout/content_tiler";
export { collectAspectRatios } from "@/features/favorites/view/skeleton/aspect_ratios";

class FavoritesSkeleton {
  private readonly items: FavoritesSkeletonItem[];
  private readonly itemCount;

  constructor(layout: Layout, itemCount = SkeletonConfig.defaultItemCount) {
    this.itemCount = itemCount;
    this.items = this.createItems(layout);
  }

  public get elements(): HTMLElement[] {
    return this.items.map((item) => item.element);
  }

  private createItems(layout: Layout): FavoritesSkeletonItem[] {
    return Array.from(
      { length: this.itemCount },
      () => new FavoritesSkeletonItem(
        layout,
        FavoritesAspectRatios.getNextAspectRatio()
      )
    );
  }
}

export function build(): HTMLElement[] {
  return new FavoritesSkeleton(getLayout(), Preferences.favoritesResultsPerPage.value).elements;
}
