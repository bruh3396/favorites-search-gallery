export class FeatureQuery<I, O> {
  private handler: (value: I) => O;
  private registered = false;

  constructor(defaultValue: O) {
    this.handler = (): O => defaultValue;
  }

  public query(value: I): O {
    return this.handler(value);
  }

  public register(handler: (value: I) => O): void {
    if (this.registered) {
      throw new Error("Handler already registered");
    }
    this.handler = handler;
    this.registered = true;
  }
}
