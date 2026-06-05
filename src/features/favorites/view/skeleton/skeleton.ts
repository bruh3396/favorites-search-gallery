import { Layout } from "@/types/ui";
import { Preferences } from "@/app/context/preferences";
import { SkeletonConfig } from "@/config/skeleton_config";
import { SkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { getLayout } from "@/app/layout/content_tiler";
import { getNextAspectRatio } from "@/features/favorites/view/thumb_aspect_ratios";

export { collectAspectRatios } from "@/features/favorites/view/thumb_aspect_ratios";

class Skeleton {
  private readonly items: SkeletonItem[];
  private readonly itemCount;

  constructor(layout: Layout, itemCount = SkeletonConfig.defaultItemCount) {
    this.itemCount = itemCount;
    this.items = this.createItems(layout);
  }

  public get elements(): HTMLElement[] {
    return this.items.map((item) => item.element);
  }

  private createItems(layout: Layout): SkeletonItem[] {
    return Array.from({ length: this.itemCount }, () => new SkeletonItem(layout, getNextAspectRatio()));
  }
}

export function favoritesSkeleton(): HTMLElement[] {
  return new Skeleton(getLayout(), Preferences.favoritesResultsPerPage.value).elements;
}
