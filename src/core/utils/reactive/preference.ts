import { Codec, createGuardedCodec } from "@/core/utils/codec/codec";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { sameKindAs } from "@/core/utils/guards/guards";

export interface Preference<T> extends Readable<T> {
  set: (value: T) => void;
}

export interface PreferenceStore {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}

export interface StoredPreferenceConfiguration<T> {
  key: string;
  defaultValue: T;
}

export interface StoredPreferenceDependencies<T> {
  store: PreferenceStore;
  codec?: Codec<T>;
}

export class StoredPreference<T> implements Preference<T> {
  private readonly codec: Codec<T>;
  private readonly current: Signal<T>;

  constructor(
    private readonly configuration: StoredPreferenceConfiguration<T>,
    private readonly dependencies: StoredPreferenceDependencies<T>
  ) {
    const { key, defaultValue } = configuration;

    this.codec = dependencies.codec ?? createGuardedCodec(sameKindAs(defaultValue));
    this.current = new Signal(this.codec.decode(dependencies.store.get(key)) ?? defaultValue);
  }

  public get value(): T {
    return this.current.value;
  }

  public peek(): T {
    return this.current.peek();
  }

  public set(value: T): void {
    if (Object.is(value, this.current.peek())) {
      return;
    }
    this.dependencies.store.set(this.configuration.key, this.codec.encode(value));
    this.current.value = value;
  }
}
