import { BaseTiler } from "./base_tiler";
import { Layout } from "../../../../types/common_types";

export class NativeTiler extends BaseTiler {
  public className: Layout = "native";
  public skeletonStyle: Record<string, string> = {
    "native": ""
  };
  public onActivate(): void { }
  public onDeactivate(): void { }
}
