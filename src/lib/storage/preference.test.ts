import { Preference, booleanPreference } from "@/lib/storage/preference";
import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { effect } from "@/core/utils/reactive/signal";

function createPreference<T>(defaultValue: T, store = new MemoryLocalKeyedValues()): Preference<T> {
  return new Preference(store, "key", defaultValue);
}

describe("Preference", () => {
  test("reads its default when nothing is stored", () => {
    expect(createPreference(true).value).toBe(true);
  });

  test("reads what is stored", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("key", false);
    expect(createPreference(true, store).value).toBe(false);
  });

  test("reads and stores what was set", () => {
    const store = new MemoryLocalKeyedValues();
    const preference = createPreference(true, store);

    preference.set(false);
    expect(preference.value).toBe(false);
    expect(createPreference(true, store).value).toBe(false);
  });

  test("notifies listeners of every set", () => {
    const preference = createPreference(1);
    const heard: number[] = [];

    preference.on((value) => heard.push(value));
    preference.set(2);
    preference.set(2);
    expect(heard).toEqual([2, 2]);
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
});
