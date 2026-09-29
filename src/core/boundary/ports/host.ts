export interface Host {
  readonly hasHeader: boolean;
  setHeaderVisible: (visible: boolean) => void;
  takeOver: () => void;
  lockViewport: () => void;
}
