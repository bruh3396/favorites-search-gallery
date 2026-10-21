export interface ObservedSize {
  readonly width: number;
  readonly height: number;
}

export interface SizeObserver {
  observe: (element: Element, onResize: (size: ObservedSize) => void) => () => void;
}
