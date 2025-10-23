import { BaseTiler } from "./base_tiler";
import { Layout } from "../../../../types/common_types";

export class SquareTiler extends BaseTiler {
  public className: Layout = "square";
  public skeletonStyle: Record<string, string> = {
    "width": "100%",
    "height": "100%",
    "aspect-ratio": "1/1"
  };
  public onActivate(): void {}
  public onDeactivate(): void {}
}
