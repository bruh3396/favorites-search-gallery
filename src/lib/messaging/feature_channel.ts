export class FeatureChannel<I, O> {
  private handler: (value: I) => O;
  private served = false;

  constructor(defaultValue: O) {
    this.handler = (): O => defaultValue;
  }

  public call(value: I): O {
    return this.handler(value);
  }

  public serve(handler: (value: I) => O): void {
    if (this.served) {
      throw new Error("Handler already registered");
    }
    this.handler = handler;
    this.served = true;
  }
}
