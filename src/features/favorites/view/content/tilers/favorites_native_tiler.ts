import { FavoriteLayout } from "../../../../../types/primitives/primitives";
import { FavoritesBaseTiler } from "./favorites_base_tiler";

class NativeTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "native";
  public skeletonStyle: Record<string, string> = { };
  public onActivate(): void { }
  public onDeactivate(): void { }
}

export const FavoritesNativeTiler = new NativeTiler();
