import { queueMacroTask } from "@/lib/async/async";

interface EmitterOptions extends AddEventListenerOptions {
  async?: boolean
}

interface ListenerFlags {
  once: boolean
  async: boolean
}

export class Emitter<V> {
  protected listeners: Map<(value: V) => void, ListenerFlags>;
  protected enabled: boolean;

  constructor(enabled: boolean = true) {
    this.listeners = new Map();
    this.enabled = enabled;
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
  }

  public on(callback: (value: V) => void, options?: EmitterOptions): void {
    if (!this.enabled) {
      return;
    }
    this.listeners.set(callback, {
      once: options?.once ?? false,
      async: options?.async ?? false
    });

    if (options?.signal) {
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

    for (const [callback, flags] of this.listeners) {
      if (flags.async) {
        queueMacroTask(() => callback(value));
      } else {
        callback(value);
      }

      if (flags.once) {
        this.listeners.delete(callback);
      }
    }
  }

  public next(): Promise<V> {
    return new Promise((resolve) => {
      this.on(resolve, { once: true });
    });
  }

  public toggle(value: boolean | undefined = undefined): void {
    this.enabled = value ?? !this.enabled;
  }
}
