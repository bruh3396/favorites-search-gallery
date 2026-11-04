import { describe, expect, test } from "vitest";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";
import { createOneOfGuard } from "@/core/utils/guard/guard";
import { createSetCodec } from "@/core/utils/codec/codec";
import { effect } from "@/core/utils/reactive/signal";

function createStorage(entries: Record<string, unknown> = {}): StoredValueStorage & { entries: Record<string, unknown> } {
  return {
    entries,
    get: (key): unknown => entries[key],
    set: (key, value): void => {
      entries[key] = value;
    }
  };
}

describe("KeyedStoredValue", () => {
  test("starts from the stored value", () => {
    const storage = createStorage({ size: 4 });

    expect(new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: storage }).value).toBe(4);
  });

  test.each([
    ["nothing is stored", {}],
    ["the stored value is a different kind", { size: "big" }]
  ])("starts from the default when %s", (_, entries) => {
    const storage = createStorage(entries);

    expect(new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: storage }).value).toBe(6);
  });

  test("stores what is set and reruns the effects that read it", () => {
    const storage = createStorage();
    const preference = new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: storage });
    const seen: number[] = [];

    effect(() => {
      seen.push(preference.value);
    });
    preference.set(8);
    expect(storage.entries).toEqual({ size: 8 });
    expect(seen).toEqual([6, 8]);
  });

  test("stores nothing when set to its current value", () => {
    const storage = createStorage();

    new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: storage }).set(6);
    expect(storage.entries).toEqual({});
  });

  test("tells its listeners what is set, after the effects see it", () => {
    const preference = new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: createStorage() });
    const seen: string[] = [];

    effect(() => {
      seen.push(`effect ${preference.value}`);
    });
    preference.changed.on(value => seen.push(`listener ${value} ${preference.value}`));
    preference.set(8);
    expect(seen).toEqual(["effect 6", "effect 8", "listener 8 8"]);
  });

  test("tells its listeners nothing when set to its current value", () => {
    const preference = new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: createStorage() });
    const seen: number[] = [];

    preference.changed.on(value => seen.push(value));
    preference.set(6);
    expect(seen).toEqual([]);
  });

  test("stops telling a listener once it stops listening", () => {
    const preference = new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: createStorage() });
    const seen: number[] = [];

    preference.changed.on(value => seen.push(value))();
    preference.set(8);
    expect(seen).toEqual([]);
  });

  test("goes back to its default on reset, storing it and telling its listeners", () => {
    const storage = createStorage({ size: 4 });
    const preference = new KeyedStoredValue({ key: "size", defaultValue: 6 }, { storedValueStorage: storage });
    const seen: number[] = [];

    preference.changed.on(value => seen.push(value));
    preference.reset();
    expect([preference.value, storage.entries, seen]).toEqual([6, { size: 6 }, [6]]);
  });

  test("decodes and encodes through its codec", () => {
    const storage = createStorage({ colors: ["red"] });
    const codec = createSetCodec(createOneOfGuard(["red", "blue"] as const));
    const preference = new KeyedStoredValue({ key: "colors", defaultValue: new Set<"red" | "blue">() }, { storedValueStorage: storage, codec });

    expect(preference.value).toEqual(new Set(["red"]));
    preference.set(new Set(["red", "blue"]));
    expect(storage.entries).toEqual({ colors: ["red", "blue"] });
  });
});
