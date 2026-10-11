import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface ResourceDependencies<S, T> {
  source: Readable<S | undefined>;
  load: (source: S) => T | Promise<T>;
  disposeValue?: (value: T) => void;
}

export class Resource<S, T> {
  private readonly valueState = new Signal<T | undefined>(undefined);
  private readonly loadingState = new Signal(false);
  private readonly errorState = new Signal<unknown>(undefined);
  private readonly disposeValue: (value: T) => void;
  private readonly stopEffect: () => void;
  private requestVersion = 0;
  private isDisposed = false;

  constructor(private readonly dependencies: ResourceDependencies<S, T>) {
    this.disposeValue = dependencies.disposeValue ?? ((): void => { });
    this.stopEffect = effect(() => this.loadSource(dependencies.source.value));
    onCleanup(() => this.dispose());
  }

  public get value(): Readable<T | undefined> {
    return this.valueState;
  }

  public get loading(): Readable<boolean> {
    return this.loadingState;
  }

  public get error(): Readable<unknown> {
    return this.errorState;
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

  private loadSource(source: S | undefined): void {
    this.requestVersion += 1;
    const requestVersion = this.requestVersion;

    this.clearValue();
    this.errorState.value = undefined;

    if (source === undefined) {
      this.loadingState.value = false;
      return;
    }
    this.loadingState.value = true;

    Promise.resolve()
      .then(() => this.dependencies.load(source))
      .then(result => {
        if (this.isCurrent(requestVersion)) {
          this.valueState.value = result;
          this.loadingState.value = false;
        } else {
          this.disposeValue(result);
        }
      }, reason => {
        if (this.isCurrent(requestVersion)) {
          this.errorState.value = reason;
          this.loadingState.value = false;
        }
      });
  }

  private isCurrent(request: number): boolean {
    return !this.isDisposed && request === this.requestVersion;
  }

  private clearValue(): void {
    const previous = this.valueState.peek();

    if (previous !== undefined) {
      this.disposeValue(previous);
      this.valueState.value = undefined;
    }
  }
}
