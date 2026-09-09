import { describe, expect, test } from "vitest";
import { KeyCodec } from "@/lib/collection/key_codec";

interface Item {
  name: string;
}

const codec = (): KeyCodec<Item> => new KeyCodec<Item>(item => item.name);

describe("KeyCodec", () => {
  test("encodes distinct items to ascending ids", () => {
    const c = codec();

    expect(c.encode({ name: "a" })).toBe(0);
    expect(c.encode({ name: "b" })).toBe(1);
    expect(c.encode({ name: "c" })).toBe(2);
  });

  test("returns the existing id when a key is re-encoded", () => {
    const c = codec();

    expect(c.encode({ name: "a" })).toBe(0);
    expect(c.encode({ name: "a" })).toBe(0);
  });

  test("keyOf derives an item's key", () => {
    expect(codec().keyOf({ name: "a" })).toBe("a");
  });

  test("hasKey reports whether a key is known", () => {
    const c = codec();

    c.encode({ name: "a" });
    expect(c.hasKey("a")).toBe(true);
    expect(c.hasKey("missing")).toBe(false);
  });

  test("decode maps ids back to their items", () => {
    const c = codec();
    const a = { name: "a" };
    const b = { name: "b" };

    c.encode(a);
    c.encode(b);
    expect(c.decode([1, 0])).toEqual([b, a]);
  });

  test("forget removes an item so decode skips its id", () => {
    const c = codec();

    c.encode({ name: "a" });
    c.encode({ name: "b" });
    expect(c.forget("a")).toBe(0);
    expect(c.hasKey("a")).toBe(false);
    expect(c.decode([0, 1])).toEqual([{ name: "b" }]);
  });

  test("forget returns undefined for an unknown key", () => {
    expect(codec().forget("missing")).toBeUndefined();
  });

  test("ids are not reused after forget", () => {
    const c = codec();

    c.encode({ name: "a" });
    c.encode({ name: "b" });
    c.forget("a");
    expect(c.encode({ name: "c" })).toBe(2);
  });
});
