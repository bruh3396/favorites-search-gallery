export interface ObservedSize {
  readonly width: number;
  readonly height: number;
  readonly devicePixelWidth: number;
}

export interface SizeObserver {
  observe: (element: Element, onResize: (size: ObservedSize) => void) => () => void;
}
