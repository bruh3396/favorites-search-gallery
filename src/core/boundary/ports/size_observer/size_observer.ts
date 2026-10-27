import { ObservedSize } from "@/core/utils/geometry/observed_size";

export interface SizeObserver {
  observe: (element: Element, onResize: (size: ObservedSize) => void) => () => void;
}
