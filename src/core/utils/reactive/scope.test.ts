import { ScopeContext, captureScope, createScope, onCleanup } from "@/core/utils/reactive/scope";
import { describe, expect, test } from "vitest";

describe("createScope", () => {
  test("returns what it builds", () => {
    expect(createScope(() => 1).result).toBe(1);
  });

  test("runs the cleanups registered while building once disposed, newest first", () => {
    const calls: string[] = [];
    const { dispose } = createScope(() => {
      onCleanup(() => calls.push("first"));
      onCleanup(() => calls.push("second"));
    });

    expect(calls).toEqual([]);
    dispose();
    expect(calls).toEqual(["second", "first"]);
  });

  test("runs each cleanup only once", () => {
    const calls: string[] = [];
    const { dispose } = createScope(() => onCleanup(() => calls.push("cleaned")));

    dispose();
    dispose();
    expect(calls).toEqual(["cleaned"]);
  });

  test("disposes a scope created inside it", () => {
    const calls: string[] = [];
    const { dispose } = createScope(() => createScope(() => onCleanup(() => calls.push("inner"))));

    dispose();
    expect(calls).toEqual(["inner"]);
  });

  test("forgets an inner scope disposed on its own", () => {
    const calls: string[] = [];
    const outer = createScope(() => createScope(() => onCleanup(() => calls.push("inner"))));

    outer.result.dispose();
    outer.dispose();
    expect(calls).toEqual(["inner"]);
  });

  test("cleans up what it built and rethrows when building fails", () => {
    const calls: string[] = [];

    expect(() => createScope(() => {
      onCleanup(() => calls.push("cleaned"));
      throw new Error("broken");
    })).toThrow("broken");
    expect(calls).toEqual(["cleaned"]);
  });
});

describe("onCleanup", () => {
  test("ignores a cleanup registered outside a scope", () => {
    const calls: string[] = [];

    onCleanup(() => calls.push("cleaned"));
    expect(calls).toEqual([]);
  });

  test("returns a function that unregisters the cleanup", () => {
    const calls: string[] = [];
    const { dispose } = createScope(() => onCleanup(() => calls.push("cleaned"))());

    dispose();
    expect(calls).toEqual([]);
  });
});

describe("captureScope", () => {
  test("creates scopes owned by the captured scope after it finished building", () => {
    const calls: string[] = [];
    const { result: createLater, dispose } = createScope(() => captureScope());

    createLater(() => onCleanup(() => calls.push("later")));
    dispose();
    expect(calls).toEqual(["later"]);
  });

  test("lets a later scope read what the captured scope provided", () => {
    const name = new ScopeContext<string>("name");
    const { result: createLater } = createScope(() => {
      name.provide("apple");
      return captureScope();
    });

    expect(createLater(() => name.read()).result).toBe("apple");
  });
});

describe("ScopeContext", () => {
  test("reads the value provided by an enclosing scope", () => {
    const name = new ScopeContext<string>("name");

    expect(createScope(() => {
      name.provide("apple");
      return createScope(() => name.read()).result;
    }).result).toBe("apple");
  });

  test("reads the nearest value provided", () => {
    const name = new ScopeContext<string>("name");

    expect(createScope(() => {
      name.provide("apple");
      return createScope(() => {
        name.provide("banana");
        return name.read();
      }).result;
    }).result).toBe("banana");
  });

  test("throws when nothing provided it", () => {
    expect(() => createScope(() => new ScopeContext<string>("name").read())).toThrow("No name was provided to this scope");
  });

  test("throws when provided outside a scope", () => {
    expect(() => new ScopeContext<string>("name").provide("apple")).toThrow("name can only be provided inside a scope");
  });
});
