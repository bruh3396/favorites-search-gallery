import {PromiseTimeoutError} from "../types/primitives/errors";

export default class EventEmitter<V> {
  private listeners: Set<(argument: V) => void>;
  private oneTimeListeners: Set<(argument: V) => void>;
  private enabled: boolean;

  get disabled(): boolean {
    return !this.enabled;
  }

  constructor(enabled: boolean = true) {
    this.listeners = new Set();
    this.oneTimeListeners = new Set();
    this.enabled = enabled;
  }

  public on(callback: (argument: V) => void, options: AddEventListenerOptions | undefined = undefined): void {
    if (this.disabled) {
      return;
    }
    this.listeners.add(callback);

    if (options === undefined) {
      return;
    }

    if (options.once) {
      this.oneTimeListeners.add(callback);
    }

    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        this.off(callback);
      });
    }
  }

  public off(callback: (argument: V) => void): void {
    this.listeners.delete(callback);
  }

  public emit(argument: V): void {
    if (this.disabled) {
      return;
    }

    for (const callback of this.listeners.keys()) {
      callback(argument);
    }
    this.removeOneTimeListeners();
  }

  public timeout(milliseconds: number): Promise<V> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(listener);
        reject(new PromiseTimeoutError());
      }, milliseconds);

      const listener = (args: V): void => {
        this.off(listener);
        clearTimeout(timer);
        resolve(args);
      };

      this.on(listener, {
        once: true
      });
    });
  }

  public toggle(value: boolean | undefined = undefined): void {
    this.enabled = value === undefined ? !this.enabled : value;
  }

  private removeOneTimeListeners(): void {
    this.listeners = this.listeners.difference(this.oneTimeListeners);
    this.oneTimeListeners.clear();
  }
}
