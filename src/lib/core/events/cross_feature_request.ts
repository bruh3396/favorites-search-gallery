export class CrossFeatureRequest<I, O> {
  private handler: (value: I) => O;

  constructor(defaultValue: O) {
    this.handler = (): O => defaultValue;
  }

  public request(value: I): O {
    return this.handler(value);
  }

  public setHandler(handler: (value: I) => O): void {
    this.handler = handler;
  }
}
