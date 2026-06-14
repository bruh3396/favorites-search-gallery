import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { Layout } from "@/types/app";

export class NativeTiler extends AbstractTiler {
  public layout: Layout = "native";
}
