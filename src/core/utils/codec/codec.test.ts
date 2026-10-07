import { Codec, createFieldsCodec, createGuardedCodec, createSetCodec } from "@/core/utils/codec/codec";
import { describe, expect, test } from "vitest";
import { isBoolean, oneOf } from "@/core/utils/guards/guards";

const COLORS = ["red", "blue"] as const;

interface Palette {
  main: (typeof COLORS)[number];
  isMuted: boolean;
}

function createPaletteCodec(): Codec<Partial<Palette>> {
  return createFieldsCodec<Palette>({ main: oneOf(COLORS), isMuted: isBoolean });
}

describe("createFieldsCodec", () => {
  test("stores the fields as they are and decodes them back", () => {
    const codec = createPaletteCodec();
    const stored = codec.encode({ main: "red", isMuted: true });

    expect(stored).toEqual({ main: "red", isMuted: true });
    expect(codec.decode(stored)).toEqual({ main: "red", isMuted: true });
  });

  test("stores only the fields it has a guard for", () => {
    expect(createPaletteCodec().encode({ main: "red", other: 1 } as Partial<Palette>)).toEqual({ main: "red" });
  });

  test("leaves out a field its guard rejects and keeps the rest", () => {
    expect(createPaletteCodec().decode({ main: "green", isMuted: false })).toEqual({ isMuted: false });
  });

  test("decodes nothing from a value that isn't a record", () => {
    expect(createPaletteCodec().decode(["red"])).toBeUndefined();
  });
});

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
