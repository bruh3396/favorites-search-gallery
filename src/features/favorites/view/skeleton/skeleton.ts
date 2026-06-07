import * as FavoritesThumbAspectRatios from "@/features/favorites/view/aspect_ratios";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/ui";
import { Preferences } from "@/app/context/preferences";
import { SkeletonConfig } from "@/config/skeleton_config";
import { getLayout } from "@/app/layout/content_tiler";

export { collectAspectRatios } from "@/features/favorites/view/aspect_ratios";

class Skeleton {
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
    return Array.from({ length: this.itemCount }, () => new FavoritesSkeletonItem(layout, FavoritesThumbAspectRatios.getNextAspectRatio()));
  }
}

export function build(): HTMLElement[] {
  return new Skeleton(getLayout(), Preferences.favoritesResultsPerPage.value).elements;
}
