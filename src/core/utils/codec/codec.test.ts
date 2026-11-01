import { Codec, createFieldsCodec, createGuardedCodec, createListCodec, createRecordCodec, createSetCodec } from "@/core/utils/codec/codec";
import { describe, expect, test } from "vitest";
import { createOneOfGuard } from "@/core/utils/guard/guard";
import { isBoolean } from "@/core/utils/guard/unknown_utilities";

const COLORS = ["red", "blue"] as const;

interface Palette {
  main: (typeof COLORS)[number];
  isMuted: boolean;
}

function createPaletteCodec(): Codec<Partial<Palette>> {
  return createFieldsCodec<Palette>({ main: createOneOfGuard(COLORS), isMuted: isBoolean });
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

describe("createRecordCodec", () => {
  const DEFAULT_PALETTE: Palette = { main: "red", isMuted: false };

  test("fills each missing or rejected field from the default", () => {
    expect(createRecordCodec(DEFAULT_PALETTE, { main: createOneOfGuard(COLORS), isMuted: isBoolean }).decode({ main: "green", isMuted: true }))
      .toEqual({ main: "red", isMuted: true });
  });

  test("decodes nothing from a value that isn't a record", () => {
    expect(createRecordCodec(DEFAULT_PALETTE, { main: createOneOfGuard(COLORS), isMuted: isBoolean }).decode("red")).toBeUndefined();
  });

  test("stores only the fields it has a guard for", () => {
    expect(createRecordCodec(DEFAULT_PALETTE, { main: createOneOfGuard(COLORS), isMuted: isBoolean }).encode({ main: "blue", isMuted: true, other: 1 } as Palette))
      .toEqual({ main: "blue", isMuted: true });
  });
});

describe("createGuardedCodec", () => {
  test("decodes a value its guard accepts and stores it as is", () => {
    const codec = createGuardedCodec(createOneOfGuard(COLORS));

    expect(codec.decode("red")).toBe("red");
    expect(codec.encode("blue")).toBe("blue");
  });

  test("decodes nothing from a value its guard rejects", () => {
    expect(createGuardedCodec(createOneOfGuard(COLORS)).decode("green")).toBeUndefined();
  });
});

describe("createSetCodec", () => {
  test("stores a set as an array and decodes it back", () => {
    const codec = createSetCodec(createOneOfGuard(COLORS));
    const stored = codec.encode(new Set(["red", "blue"]));

    expect(stored).toEqual(["red", "blue"]);
    expect(codec.decode(stored)).toEqual(new Set(["red", "blue"]));
  });

  test.each([
    ["a non-array", { red: true }],
    ["an array with a rejected member", ["red", "green"]]
  ])("decodes nothing from %s", (_, stored) => {
    expect(createSetCodec(createOneOfGuard(COLORS)).decode(stored)).toBeUndefined();
  });
});

describe("createListCodec", () => {
  test("stores each entry with its codec and decodes them back", () => {
    const codec = createListCodec(createPaletteCodec());
    const stored = codec.encode([{ main: "red", other: 1 } as Partial<Palette>, { isMuted: true }]);

    expect(stored).toEqual([{ main: "red" }, { isMuted: true }]);
    expect(codec.decode(stored)).toEqual([{ main: "red" }, { isMuted: true }]);
  });

  test("drops an entry its codec rejects and keeps the rest", () => {
    expect(createListCodec(createGuardedCodec(createOneOfGuard(COLORS))).decode(["red", "green", "blue"])).toEqual(["red", "blue"]);
  });

  test("decodes nothing from a non-array", () => {
    expect(createListCodec(createGuardedCodec(createOneOfGuard(COLORS))).decode({ 0: "red" })).toBeUndefined();
  });
});
