import { BaseTiler } from "./favorites_base_tiler";
import { FavoriteLayout } from "../../../../types/primitives/primitives";

class SquareTiler extends BaseTiler {
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
