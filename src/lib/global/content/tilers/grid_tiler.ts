import { BaseTiler } from "./base_tiler";
import { Layout } from "../../../../types/common_types";

export class GridTiler extends BaseTiler {
  public className: Layout = "grid";
  public skeletonStyle: Record<string, string> = {
    "width": "100%"
  };
  public onActivate(): void {}
  public onDeactivate(): void {}
}
