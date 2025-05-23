import { FavoriteLayout } from "../../../../../types/primitives/primitives";
import { FavoritesBaseTiler } from "./favorites_base_tiler";

class SquareTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "square";
  public skeletonStyle: Record<string, string> = {
    "width": "100%",
    "height": "100%",
    "aspect-ratio": "1/1"
  };
  public onActivation(): void {}
  public onDeactivation(): void {}
}

export const FavoritesSquareTiler = new SquareTiler();
