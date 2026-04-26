import { AbstractTiler } from "./abstract_tiler";
import { LayoutMode } from "../../../types/common_types";

export class GridTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "grid";
}
