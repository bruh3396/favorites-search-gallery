import { BaseTiler } from "./favorites_base_tiler";
import { FavoriteLayout } from "../../../../../types/common_types";

export class GridTiler extends BaseTiler {
  public className: FavoriteLayout = "grid";
  public skeletonStyle: Record<string, string> = {
    "width": "100%"
  };
  public onActivate(): void {}
  public onDeactivate(): void {}
}
