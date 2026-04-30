import { AbstractTiler } from "./abstract_tiler";
import { LayoutMode } from "../../../types/ui";

export class SquareTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "square";
}
