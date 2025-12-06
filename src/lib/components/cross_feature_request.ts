export class CrossFeatureRequest<K, L> {
  private handler: (value: L) => K;

  constructor(defaultValue: K) {
    this.handler = (): K => defaultValue;
  }

  public request(value: L): K {
    return this.handler(value);
  }

  public setHandler(handler: (value: L) => K): void {
    this.handler = handler;
  }
}
