import { Codec, createGuardedCodec } from "@/core/utils/codec/codec";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { StoredValueStorage } from "@/core/utils/stored_value/stored_value_storage";
import { Signal } from "@/core/utils/reactive/signal";
import { sameKindAs } from "@/core/utils/guard/guard";

export interface KeyedStoredValueConfiguration<T> {
  readonly key: string;
  readonly defaultValue: T;
}

export interface KeyedStoredValueDependencies<T> {
  storedValueStorage: StoredValueStorage;
  codec?: Codec<T>;
}

export class KeyedStoredValue<T> implements StoredValue<T> {
  private readonly codec: Codec<T>;
  private readonly current: Signal<T>;
  private readonly changes = new Emitter<T>();

  constructor(
    private readonly configuration: KeyedStoredValueConfiguration<T>,
    private readonly dependencies: KeyedStoredValueDependencies<T>
  ) {
    const { key, defaultValue } = configuration;

    this.codec = dependencies.codec ?? createGuardedCodec(sameKindAs(defaultValue));
    this.current = new Signal(this.codec.decode(dependencies.storedValueStorage.get(key)) ?? defaultValue);
  }

  public get value(): T {
    return this.current.value;
  }

  public get changed(): Occurrence<T> {
    return this.changes;
  }

  public peek(): T {
    return this.current.peek();
  }

  public set(value: T): void {
    if (Object.is(value, this.current.peek())) {
      return;
    }
    this.dependencies.storedValueStorage.set(this.configuration.key, this.codec.encode(value));
    this.current.value = value;
    this.changes.emit(value);
  }
}
