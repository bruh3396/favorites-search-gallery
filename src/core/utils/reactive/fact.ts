export interface Fact<V = void> {
  readonly reached: boolean;
  wait: () => Promise<V>;
}
