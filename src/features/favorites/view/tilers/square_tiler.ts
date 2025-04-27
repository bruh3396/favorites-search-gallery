import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesBaseTiler} from "./base_tiler";

class FavoritesSquareTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "square";

  protected createSkeletonItem(): HTMLElement {
    const skeletonItem = super.createSkeletonItem();

    skeletonItem.style.width = "100%";
    skeletonItem.style.height = "100%";
    skeletonItem.style.aspectRatio = "1/1";
    return skeletonItem;
  }

  public onActivation(): void {
  }

  public onDeactivation(): void {
  }
}

export const SquareTiler = new FavoritesSquareTiler();
