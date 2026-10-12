import { PreferenceStorage, StoredPreference, createPreferences, definePreference, defineRecordPreference } from "@/core/utils/reactive/preference";
import { describe, expect, test } from "vitest";
import { isBoolean, isNumber, oneOf } from "@/core/utils/guards/guards";
import { createSetCodec } from "@/core/utils/codec/codec";
import { effect } from "@/core/utils/reactive/signal";

function createStorage(entries: Record<string, unknown> = {}): PreferenceStorage & { entries: Record<string, unknown> } {
  return {
    entries,
    get: (key): unknown => entries[key],
    set: (key, value): void => {
      entries[key] = value;
    }
  };
}

describe("definePreference", () => {
  test("accepts only values of the default's kind when given no guard", () => {
    const { codec } = definePreference(6);

    expect([codec.decode(4), codec.decode("big")]).toEqual([4, undefined]);
  });

  test("accepts only what its guard accepts", () => {
    const { codec } = definePreference<"red" | "blue">("red", oneOf(["red", "blue"] as const));

    expect([codec.decode("blue"), codec.decode("green")]).toEqual(["blue", undefined]);
  });
});

describe("defineRecordPreference", () => {
  test("decodes each rejected field as its default", () => {
    const { codec } = defineRecordPreference({ size: 6, isOpen: false }, { size: isNumber, isOpen: isBoolean });

    expect(codec.decode({ size: "big", isOpen: true })).toEqual({ size: 6, isOpen: true });
  });
});

describe("createPreferences", () => {
  test("stores each preference under its name in the schema", () => {
    const storage = createStorage({ size: 4 });
    const { size, isOpen } = createPreferences({ size: definePreference(6), isOpen: definePreference(false) }, storage);

    isOpen.set(true);
    expect(size.value).toBe(4);
    expect(storage.entries).toEqual({ size: 4, isOpen: true });
  });
});

describe("StoredPreference", () => {
  test("starts from the stored value", () => {
    const storage = createStorage({ size: 4 });

    expect(new StoredPreference({ key: "size", defaultValue: 6 }, { storage }).value).toBe(4);
  });

  test.each([
    ["nothing is stored", {}],
    ["the stored value is a different kind", { size: "big" }]
  ])("starts from the default when %s", (_, entries) => {
    const storage = createStorage(entries);

    expect(new StoredPreference({ key: "size", defaultValue: 6 }, { storage }).value).toBe(6);
  });

  test("stores what is set and reruns the effects that read it", () => {
    const storage = createStorage();
    const preference = new StoredPreference({ key: "size", defaultValue: 6 }, { storage });
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

    new StoredPreference({ key: "size", defaultValue: 6 }, { storage }).set(6);
    expect(storage.entries).toEqual({});
  });

  test("tells its listeners what is set, after the effects see it", () => {
    const preference = new StoredPreference({ key: "size", defaultValue: 6 }, { storage: createStorage() });
    const seen: string[] = [];

    effect(() => {
      seen.push(`effect ${preference.value}`);
    });
    preference.changed.on(value => seen.push(`listener ${value} ${preference.value}`));
    preference.set(8);
    expect(seen).toEqual(["effect 6", "effect 8", "listener 8 8"]);
  });

  test("tells its listeners nothing when set to its current value", () => {
    const preference = new StoredPreference({ key: "size", defaultValue: 6 }, { storage: createStorage() });
    const seen: number[] = [];

    preference.changed.on(value => seen.push(value));
    preference.set(6);
    expect(seen).toEqual([]);
  });

  test("stops telling a listener once it stops listening", () => {
    const preference = new StoredPreference({ key: "size", defaultValue: 6 }, { storage: createStorage() });
    const seen: number[] = [];

    preference.changed.on(value => seen.push(value))();
    preference.set(8);
    expect(seen).toEqual([]);
  });

  test("decodes and encodes through its codec", () => {
    const storage = createStorage({ colors: ["red"] });
    const codec = createSetCodec(oneOf(["red", "blue"] as const));
    const preference = new StoredPreference({ key: "colors", defaultValue: new Set<"red" | "blue">() }, { storage, codec });

    expect(preference.value).toEqual(new Set(["red"]));
    preference.set(new Set(["red", "blue"]));
    expect(storage.entries).toEqual({ colors: ["red", "blue"] });
  });
});
