export interface Occurrence<V> {
  on: (listener: (value: V) => void) => () => void;
  once: (listener: (value: V) => void) => () => void;
}
