import { Codec, FieldGuards, createGuardedCodec, createRecordCodec } from "@/core/utils/codec/codec";
import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { Guard, sameKindAs } from "@/core/utils/guards/guards";
import { Readable, Signal } from "@/core/utils/reactive/signal";

export interface Preference<T> extends Readable<T> {
  set: (value: T) => void;
  readonly changed: Occurrence<T>;
}

export interface PreferenceStorage {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}

export interface StoredPreferenceConfiguration<T> {
  readonly key: string;
  readonly defaultValue: T;
}

export interface StoredPreferenceDependencies<T> {
  storage: PreferenceStorage;
  codec?: Codec<T>;
}

export interface PreferenceDefinition<T> {
  readonly defaultValue: T;
  readonly codec: Codec<T>;
}

export type PreferenceSchema<T extends object> = { readonly [K in keyof T]: PreferenceDefinition<T[K]> };

export type Preferences<T extends object> = { readonly [K in keyof T]: Preference<T[K]> };

export function definePreference<T>(defaultValue: T, accepts: Guard<T> = sameKindAs(defaultValue)): PreferenceDefinition<T> {
  return { defaultValue, codec: createGuardedCodec(accepts) };
}

export function defineRecordPreference<T extends object>(defaultValue: T, fields: FieldGuards<T>): PreferenceDefinition<T> {
  return { defaultValue, codec: createRecordCodec(defaultValue, fields) };
}

export function createPreferences<T extends object>(schema: PreferenceSchema<T>, storage: PreferenceStorage): Preferences<T> {
  const definitions = Object.entries(schema) as Array<[string, PreferenceDefinition<unknown>]>;
  return Object.fromEntries(definitions
    .map(([key, { defaultValue, codec }]) => [key, new StoredPreference({ key, defaultValue }, { storage, codec })])) as unknown as Preferences<T>;
}

export class StoredPreference<T> implements Preference<T> {
  private readonly codec: Codec<T>;
  private readonly current: Signal<T>;
  private readonly changes = new Emitter<T>();

  constructor(
    private readonly configuration: StoredPreferenceConfiguration<T>,
    private readonly dependencies: StoredPreferenceDependencies<T>
  ) {
    const { key, defaultValue } = configuration;

    this.codec = dependencies.codec ?? createGuardedCodec(sameKindAs(defaultValue));
    this.current = new Signal(this.codec.decode(dependencies.storage.get(key)) ?? defaultValue);
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
    this.dependencies.storage.set(this.configuration.key, this.codec.encode(value));
    this.current.value = value;
    this.changes.emit(value);
  }
}
