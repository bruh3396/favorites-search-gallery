import { AbstractTiler } from "./abstract_tiler";
import { LayoutMode } from "../../../types/common_types";

export class SquareTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "square";
}
