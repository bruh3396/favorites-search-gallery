import { FavoriteLayout } from "../../../../../types/common_types";
import { FavoritesBaseTiler } from "./favorites_base_tiler";

class NativeTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "native";
  public skeletonStyle: Record<string, string> = {
    "native": ""
  };
  public onActivate(): void { }
  public onDeactivate(): void { }
}

export const FavoritesNativeTiler = new NativeTiler();
