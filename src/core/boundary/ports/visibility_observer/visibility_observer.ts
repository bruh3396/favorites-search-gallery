export interface VisibilityObserver {
  observe: (element: Element, onVisibilityChange: (visible: boolean) => void) => () => void;
}
