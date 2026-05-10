import { AbstractTiler } from "./abstract_tiler";
import { Layout } from "../../../types/ui";

export class GridTiler extends AbstractTiler {
  public layout: Layout = "tiler--grid";
}
