import { Preferences } from "../../../../lib/preferences/preferences";
import { SkeletonItem } from "./favorites_skeleton_item";
import { getSkeletonStyle } from "./favorites_skeleton_style";

export class Skeleton {
  private readonly items: SkeletonItem[];

  constructor(style: Record<string, string>) {
    this.items = this.createItems(style);
  }

  public get elements(): HTMLElement[] {
    return this.items.map((item) => item.element);
  }

  private get itemCount(): number {
    return Math.min(Preferences.resultsPerPage.value, 200);
  }

  private createItems(style: Record<string, string>): SkeletonItem[] {
    return Array.from({length: this.itemCount}, () => new SkeletonItem(style));
  }
}

export function getSkeleton(): HTMLElement[] {
  return new Skeleton(getSkeletonStyle()).elements;
}
