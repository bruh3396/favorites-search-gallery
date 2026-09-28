export interface Host {
  readonly setHeaderVisible: ((visible: boolean) => void) | null;
  takeOver: () => void;
  lockViewport: () => void;
}
