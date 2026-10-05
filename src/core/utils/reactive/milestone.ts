import { effect } from "@/core/utils/reactive/signal";

export interface Fact<V = void> {
  readonly reached: boolean;
  wait: () => Promise<V>;
}

export class Milestone<V = void> implements Fact<V> {
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

export function when(condition: () => boolean): Fact {
  const milestone = new Milestone();

  effect(() => {
    if (!milestone.reached && condition()) {
      milestone.reach();
    }
  });
  return milestone;
}
