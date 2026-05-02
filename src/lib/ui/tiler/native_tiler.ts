import { AbstractTiler } from "./abstract_tiler";
import { LayoutMode } from "../../../types/ui";

export class NativeTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "native";
}
