import { createGuardedCodec, createSetCodec } from "@/core/utils/codec/codec";
import { describe, expect, test } from "vitest";
import { oneOf } from "@/core/utils/guards/guards";

const COLORS = ["red", "blue"] as const;

describe("createGuardedCodec", () => {
  test("decodes a value its guard accepts and stores it as is", () => {
    const codec = createGuardedCodec(oneOf(COLORS));

    expect(codec.decode("red")).toBe("red");
    expect(codec.encode("blue")).toBe("blue");
  });

  test("decodes nothing from a value its guard rejects", () => {
    expect(createGuardedCodec(oneOf(COLORS)).decode("green")).toBeUndefined();
  });
});

describe("createSetCodec", () => {
  test("stores a set as an array and decodes it back", () => {
    const codec = createSetCodec(oneOf(COLORS));
    const stored = codec.encode(new Set(["red", "blue"]));

    expect(stored).toEqual(["red", "blue"]);
    expect(codec.decode(stored)).toEqual(new Set(["red", "blue"]));
  });

  test.each([
    ["a non-array", { red: true }],
    ["an array with a rejected member", ["red", "green"]]
  ])("decodes nothing from %s", (_, stored) => {
    expect(createSetCodec(oneOf(COLORS)).decode(stored)).toBeUndefined();
  });
});
