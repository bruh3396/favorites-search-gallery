import { PreferenceStore, StoredPreference } from "@/core/utils/reactive/preference";
import { describe, expect, test } from "vitest";
import { createSetCodec } from "@/core/utils/codec/codec";
import { effect } from "@/core/utils/reactive/signal";
import { oneOf } from "@/core/utils/guards/guards";

function createStore(entries: Record<string, unknown> = {}): PreferenceStore & { entries: Record<string, unknown> } {
  return {
    entries,
    get: (key): unknown => entries[key],
    set: (key, value): void => {
      entries[key] = value;
    }
  };
}

describe("StoredPreference", () => {
  test("starts from the stored value", () => {
    const store = createStore({ size: 4 });

    expect(new StoredPreference({ key: "size", defaultValue: 6 }, { store }).value).toBe(4);
  });

  test.each([
    ["nothing is stored", {}],
    ["the stored value is a different kind", { size: "big" }]
  ])("starts from the default when %s", (_, entries) => {
    const store = createStore(entries);

    expect(new StoredPreference({ key: "size", defaultValue: 6 }, { store }).value).toBe(6);
  });

  test("stores what is set and reruns the effects that read it", () => {
    const store = createStore();
    const preference = new StoredPreference({ key: "size", defaultValue: 6 }, { store });
    const seen: number[] = [];

    effect(() => {
      seen.push(preference.value);
    });
    preference.set(8);
    expect(store.entries).toEqual({ size: 8 });
    expect(seen).toEqual([6, 8]);
  });

  test("stores nothing when set to its current value", () => {
    const store = createStore();

    new StoredPreference({ key: "size", defaultValue: 6 }, { store }).set(6);
    expect(store.entries).toEqual({});
  });

  test("decodes and encodes through its codec", () => {
    const store = createStore({ colors: ["red"] });
    const codec = createSetCodec(oneOf(["red", "blue"] as const));
    const preference = new StoredPreference({ key: "colors", defaultValue: new Set<"red" | "blue">() }, { store, codec });

    expect(preference.value).toEqual(new Set(["red"]));
    preference.set(new Set(["red", "blue"]));
    expect(store.entries).toEqual({ colors: ["red", "blue"] });
  });
});
