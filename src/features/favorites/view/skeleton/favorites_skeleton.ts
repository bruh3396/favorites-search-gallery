import { LayoutMode } from "../../../../types/ui";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SkeletonItem } from "./favorites_skeleton_item";
import { getLayout } from "../../../../lib/layout/layout";

const DEFAULT_ITEM_COUNT = 50;

export class Skeleton {
  private readonly items: SkeletonItem[];
  private readonly itemCount;

  constructor(layout: LayoutMode, itemCount = DEFAULT_ITEM_COUNT) {
    this.itemCount = itemCount;
    this.items = this.createItems(layout);
  }

  public get elements(): HTMLElement[] {
    return this.items.map((item) => item.element);
  }

  private createItems(layout: LayoutMode): SkeletonItem[] {
    return Array.from({length: this.itemCount}, () => new SkeletonItem(layout));
  }
}

export function getFavoritesSkeleton(): HTMLElement[] {
  return new Skeleton(getLayout(), Preferences.resultsPerPage.value).elements;
}
