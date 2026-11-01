import { describe, expect, test } from "vitest";
import { createOneOfGuard } from "@/core/utils/guard/guard";
import { createSetCodec } from "@/core/utils/codec/codec";
import { createStoredValueDefinition } from "@/core/utils/storage/stored_value_definition";
import { isNumber } from "@/core/utils/guard/unknown_utilities";

describe("createStoredValueDefinition", () => {
  test("accepts only values of the default's kind when given no guard", () => {
    const { codec } = createStoredValueDefinition(6);

    expect([codec.decode(4), codec.decode("big")]).toEqual([4, undefined]);
  });

  test("accepts only what its guard accepts", () => {
    const { codec } = createStoredValueDefinition<"red" | "blue">("red", createOneOfGuard(["red", "blue"] as const));

    expect([codec.decode("blue"), codec.decode("green")]).toEqual(["blue", undefined]);
  });

  test("uses a codec it is given as is", () => {
    const codec = createSetCodec(isNumber);

    expect(createStoredValueDefinition<ReadonlySet<number>>(new Set(), codec).codec).toBe(codec);
  });
});
