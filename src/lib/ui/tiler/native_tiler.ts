import { AbstractTiler } from "./abstract_tiler";
import { LayoutMode } from "../../../types/common_types";

export class NativeTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "native";
}
