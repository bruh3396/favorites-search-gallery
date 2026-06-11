import { Emitter } from "@/lib/communication/emitter";
import { withTimeout } from "@/lib/async/timing";

export class StickyEmitter<V> extends Emitter<V> {
  private lastValue: V | undefined;
  private hasFired: boolean = false;

  public get fired(): boolean {
    return this.hasFired;
  }

  public override emit(value: V): void {
    this.lastValue = value;
    this.hasFired = true;
    super.emit(value);
  }

  public wait(): Promise<V> {
    return super.next();
  }

  public timeout(milliseconds: number = 1_000): Promise<V | undefined> {
    return withTimeout(this.wait(), milliseconds).catch(() => undefined);
  }

  public override next(): Promise<V> {
    throw new Error("Use wait() on StickyEmitter instead of next()");
  }

  public override on(callback: (value: V) => void, options: AddEventListenerOptions | undefined = undefined): void {
    super.on(callback, options);

    if (!this.enabled || !this.hasFired) {
      return;
    }
    callback(this.lastValue as V);

    if (options?.once) {
      this.off(callback);
    }
  }
}
