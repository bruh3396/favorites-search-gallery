import { FavoriteLayout } from "../../../../../types/common_types";
import { FavoritesBaseTiler } from "./favorites_base_tiler";

class GridTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "grid";
  public skeletonStyle: Record<string, string> = {
    "width": "100%"
  };
  public onActivate(): void {}
  public onDeactivate(): void {}
}

export const FavoritesGridTiler = new GridTiler();
