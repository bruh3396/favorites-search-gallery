import { Signal, effect } from "@/core/utils/reactive/signal";

export interface Fact<V = void> {
  readonly reached: boolean;
  wait: () => Promise<V>;
}

export class Milestone<V = void> implements Fact<V> {
  private readonly deferred = Promise.withResolvers<V>();
  private readonly isReached = new Signal(false);

  public get reached(): boolean {
    return this.isReached.value;
  }

  public peek(): boolean {
    return this.isReached.peek();
  }

  public reach(value: V): void {
    if (this.isReached.peek()) {
      throw new Error("Milestone reached twice");
    }
    this.deferred.resolve(value);
    this.isReached.value = true;
  }

  public wait(): Promise<V> {
    return this.deferred.promise;
  }
}

export function when(condition: () => boolean): Fact {
  const milestone = new Milestone();

  effect(() => {
    if (!milestone.peek() && condition()) {
      milestone.reach();
    }
  });
  return milestone;
}
