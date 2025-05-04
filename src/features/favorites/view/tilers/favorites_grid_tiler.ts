import { BaseTiler } from "./favorites_base_tiler";
import { FavoriteLayout } from "../../../../types/primitives/primitives";

class GridTiler extends BaseTiler {
  public className: FavoriteLayout = "grid";
  public skeletonStyle: Record<string, string> = {
    "width": "100%"
  };
  public onActivation(): void {}
  public onDeactivation(): void {}
}

export const FavoritesGridTiler = new GridTiler();
