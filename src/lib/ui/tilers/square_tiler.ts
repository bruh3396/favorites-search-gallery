import { AbstractTiler } from "./abstract_tiler";
import { Layout } from "../../../types/ui";

export class SquareTiler extends AbstractTiler {
  public layout: Layout = "tiler--square";
}
