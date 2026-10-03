import { Guard, oneOf } from "@/core/utils/guards/guards";
import { Preference, StoredPreference, booleanPreference } from "@/lib/storage/preference";
import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { effect } from "@/core/utils/reactive/signal";

function createPreference<T>(defaultValue: T, store = new MemoryLocalKeyedValues(), accepts?: Guard<T>): Preference<T> {
  return new StoredPreference({ key: "key", defaultValue }, { store, accepts });
}

function createStore(stored: unknown): MemoryLocalKeyedValues {
  const store = new MemoryLocalKeyedValues();

  store.set("key", stored);
  return store;
}

describe("StoredPreference", () => {
  test("reads its default when nothing is stored", () => {
    expect(createPreference(true).value).toBe(true);
  });

  test("reads what is stored", () => {
    expect(createPreference(true, createStore(false)).value).toBe(false);
  });

  test.each([
    ["a string for a boolean", true, "yes"],
    ["a number for a string", "column", 3],
    ["an array for a record", {}, []],
    ["null for a record", {}, null]
  ])("reads its default when %s is stored", (_, defaultValue, stored) => {
    expect(createPreference<unknown>(defaultValue, createStore(stored)).value).toBe(defaultValue);
  });

  test("reads its default when the stored value fails its guard", () => {
    const layout = createPreference("column", createStore("masonry"), oneOf(["column", "row"]));

    expect(layout.value).toBe("column");
  });

  test("reads a stored value that passes its guard", () => {
    const layout = createPreference("column", createStore("row"), oneOf(["column", "row"]));

    expect(layout.value).toBe("row");
  });

  test("reads and stores what was set", () => {
    const store = new MemoryLocalKeyedValues();
    const preference = createPreference(true, store);

    preference.set(false);
    expect(preference.value).toBe(false);
    expect(createPreference(true, store).value).toBe(false);
  });

  test("notifies listeners only when its value changes", () => {
    const preference = createPreference(1);
    const heard: number[] = [];

    preference.on((value) => heard.push(value));
    preference.set(2);
    preference.set(2);
    preference.set(1);
    expect(heard).toEqual([2, 1]);
  });

  test("stops a listener when its unsubscribe is called", () => {
    const preference = createPreference(1);
    const heard: number[] = [];
    const off = preference.on((value) => heard.push(value));

    off();
    preference.set(2);
    expect(heard).toEqual([]);
  });

  test("does not store a set of the same value", () => {
    const store = new MemoryLocalKeyedValues();

    createPreference(true, store).set(true);
    expect(store.get("key")).toBeUndefined();
  });

  test("reruns an effect that read it when its value changes", () => {
    const preference = createPreference(true);
    const seen: boolean[] = [];

    effect(() => seen.push(preference.value));
    preference.set(false);
    preference.set(false);
    expect(seen).toEqual([true, false]);
  });

  test("lets an effect set another preference", () => {
    const source = createPreference(1);
    const target = createPreference(0);

    effect(() => target.set(source.value * 2));
    source.set(5);
    expect(target.value).toBe(10);
  });
});

describe("booleanPreference", () => {
  test("reruns an effect when its source changes", () => {
    const source = createPreference<"dark" | "light">("light");
    const dark = booleanPreference(source, "dark", "light");
    const seen: boolean[] = [];

    effect(() => seen.push(dark.value));
    source.set("dark");
    expect(seen).toEqual([false, true]);
  });

  test("writes the source value that matches", () => {
    const source = createPreference<"dark" | "light">("light");

    booleanPreference(source, "dark", "light").set(true);
    expect(source.value).toBe("dark");
  });

  test("notifies listeners only when its own value changes", () => {
    const source = createPreference<"off" | "hover" | "always">("off");
    const always = booleanPreference(source, "always", "off");
    const heard: boolean[] = [];

    always.on((value) => heard.push(value));
    source.set("hover");
    source.set("always");
    source.set("off");
    expect(heard).toEqual([true, false]);
  });
});
