import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { Layout } from "@/types/ui";

export class GridTiler extends AbstractTiler {
  public layout: Layout = "grid";
}
