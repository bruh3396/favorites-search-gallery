import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesBaseTiler} from "./favorites_base_tiler";

class FavoritesGridTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "grid";
  public skeletonStyle: Record<string, string> = {
    "width": "100%"
  };
  public onActivation(): void {}
  public onDeactivation(): void {}
}

export const GridTiler = new FavoritesGridTiler();
