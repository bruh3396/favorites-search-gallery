import { BaseTiler } from "./favorites_base_tiler";
import { FavoriteLayout } from "../../../../../types/common_types";

export class NativeTiler extends BaseTiler {
  public className: FavoriteLayout = "native";
  public skeletonStyle: Record<string, string> = {
    "native": ""
  };
  public onActivate(): void { }
  public onDeactivate(): void { }
}
