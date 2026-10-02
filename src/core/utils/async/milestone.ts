export class Milestone<V = void> {
  private readonly deferred = Promise.withResolvers<V>();
  private isReached = false;

  public get reached(): boolean {
    return this.isReached;
  }

  public reach(value: V): void {
    if (this.isReached) {
      throw new Error("Milestone reached twice");
    }
    this.isReached = true;
    this.deferred.resolve(value);
  }

  public wait(): Promise<V> {
    return this.deferred.promise;
  }
}
