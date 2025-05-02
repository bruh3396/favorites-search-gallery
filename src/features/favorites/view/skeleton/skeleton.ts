import {Preferences} from "../../../../store/preferences/preferences";
import {SkeletonItem} from "./skeleton_item";

export class Skeleton {
  private readonly items: SkeletonItem[];

  get elements(): HTMLElement[] {
    return this.items.map((item) => item.element);
  }

  private get itemCount(): number {
    return Math.min(Preferences.resultsPerPage.value, 50);
  }

  constructor(style: Record<string, string>) {
    this.items = this.createItems(style);
  }

  private createItems(style: Record<string, string>): SkeletonItem[] {
    return Array.from({length: this.itemCount}, () => new SkeletonItem(style));
  }
}
