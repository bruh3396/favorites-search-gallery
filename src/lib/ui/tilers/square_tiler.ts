import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { Layout } from "@/types/app";

export class SquareTiler extends AbstractTiler {
  public layout: Layout = "square";
}
