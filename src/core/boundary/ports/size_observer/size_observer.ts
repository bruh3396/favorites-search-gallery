import { Size } from "@/core/utils/geometry/size";

export interface ObservedSize extends Size {
  readonly devicePixelWidth: number;
}

export interface SizeObserver {
  observe: (element: Element, onResize: (size: ObservedSize) => void) => () => void;
}
