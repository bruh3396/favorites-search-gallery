import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesBaseTiler} from "./base_tiler";

class FavoritesGridTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "grid";

  protected createSkeletonItem(): HTMLElement {
    const skeletonItem = super.createSkeletonItem();

    skeletonItem.style.width = "100%";
    return skeletonItem;
  }

  public onActivation(): void {
  }

  public onDeactivation(): void {
  }
}

export const GridTiler = new FavoritesGridTiler();
