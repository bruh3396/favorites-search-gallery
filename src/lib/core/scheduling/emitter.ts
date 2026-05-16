export class Emitter<V> {
  protected listeners: Set<(value: V) => void>;
  protected onceListeners: Set<(value: V) => void>;
  protected enabled: boolean;

  constructor(enabled: boolean = true) {
    this.listeners = new Set();
    this.onceListeners = new Set();
    this.enabled = enabled;
    this.emit = this.emit.bind(this);
  }

  public on(callback: (value: V) => void, options: AddEventListenerOptions | undefined = undefined): void {
    if (!this.enabled) {
      return;
    }
    this.listeners.add(callback);

    if (options === undefined) {
      return;
    }

    if (options.once) {
      this.onceListeners.add(callback);
    }

    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        this.off(callback);
      });
    }
  }

  public off(callback: (value: V) => void): void {
    this.listeners.delete(callback);
  }

  public emit(value: V): void {
    if (!this.enabled) {
      return;
    }

    for (const callback of this.listeners) {
      callback(value);
    }
    this.removeOneTimeListeners();
  }

  public next(): Promise<V> {
    return new Promise((resolve) => {
      this.on(resolve, { once: true });
    });
  }

  public toggle(value: boolean | undefined = undefined): void {
    this.enabled = value ?? !this.enabled;
  }

  private removeOneTimeListeners(): void {
    this.listeners = this.listeners.difference(this.onceListeners);
    this.onceListeners.clear();
  }
}
