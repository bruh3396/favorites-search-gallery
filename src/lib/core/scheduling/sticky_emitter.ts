import { Emitter } from "./emitter";

export class StickyEmitter<V> extends Emitter<V> {
  private lastValue: V | undefined;
  private hasFired: boolean = false;

  public override emit(value: V): void {
    this.lastValue = value;
    this.hasFired = true;
    super.emit(value);
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
