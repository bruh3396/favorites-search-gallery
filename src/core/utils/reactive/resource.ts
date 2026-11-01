import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface ResourceDependencies<Source, Value> {
  source: Readable<Source | undefined>;
  load: (source: Source) => Value | Promise<Value>;
  disposeValue?: (value: Value) => void;
}

export class Resource<Source, Value> {
  private readonly disposeValue: (value: Value) => void;
  private readonly stopEffect: () => void;
  private requestVersion = 0;
  private isDisposed = false;
  readonly #value = new Signal<Value | undefined>(undefined);
  readonly #loading = new Signal(false);
  readonly #error = new Signal<unknown>(undefined);

  constructor(private readonly dependencies: ResourceDependencies<Source, Value>) {
    this.disposeValue = dependencies.disposeValue ?? ((): void => { });
    this.stopEffect = effect(() => this.loadSource(dependencies.source.value));
    onCleanup(() => this.dispose());
  }

  public get value(): Readable<Value | undefined> {
    return this.#value;
  }

  public get loading(): Readable<boolean> {
    return this.#loading;
  }

  public get error(): Readable<unknown> {
    return this.#error;
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.requestVersion += 1;
    this.stopEffect();
    this.clearValue();
  }

  private loadSource(source: Source | undefined): void {
    this.requestVersion += 1;
    const requestVersion = this.requestVersion;

    this.clearValue();
    this.#error.value = undefined;

    if (source === undefined) {
      this.#loading.value = false;
      return;
    }
    this.#loading.value = true;

    Promise.resolve()
      .then(() => this.dependencies.load(source))
      .then(value => {
        if (this.isCurrent(requestVersion)) {
          this.#value.value = value;
          this.#loading.value = false;
        } else {
          this.disposeValue(value);
        }
      }, reason => {
        if (this.isCurrent(requestVersion)) {
          this.#error.value = reason;
          this.#loading.value = false;
        }
      });
  }

  private isCurrent(request: number): boolean {
    return !this.isDisposed && request === this.requestVersion;
  }

  private clearValue(): void {
    const currentValue = this.#value.peek();

    if (currentValue !== undefined) {
      this.disposeValue(currentValue);
      this.#value.value = undefined;
    }
  }
}
