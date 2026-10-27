import { Size } from "@/core/utils/geometry/size";

export interface ObservedSize extends Size {
  readonly devicePixelWidth: number;
}
