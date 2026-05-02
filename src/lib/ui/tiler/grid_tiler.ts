import { AbstractTiler } from "./abstract_tiler";
import { LayoutMode } from "../../../types/ui";

export class GridTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "grid";
}
