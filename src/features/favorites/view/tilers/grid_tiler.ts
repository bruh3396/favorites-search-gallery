import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesBaseTiler} from "./base_tiler";
import {getRandomPositiveIntegerInRange} from "../../../../utils/primitive/number";

class FavoritesGridTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "grid";

  protected createSkeletonItem(): HTMLElement {
    const skeletonItem = super.createSkeletonItem();

    skeletonItem.style.width = "100%";
    skeletonItem.style.aspectRatio = `10/${getRandomPositiveIntegerInRange(5, 20)}`;
    return skeletonItem;
  }

  public onActivation(): void {
  }

  public onDeactivation(): void {
  }
}

export const GridTiler = new FavoritesGridTiler();
