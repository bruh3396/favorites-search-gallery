import { describe, expect, test } from "vitest";
import { isNumber, oneOf } from "@/core/utils/guard/guard";
import { createSetCodec } from "@/core/utils/codec/codec";
import { defineStoredValue } from "@/core/utils/stored_value/stored_value_definition";

describe("defineStoredValue", () => {
  test("accepts only values of the default's kind when given no guard", () => {
    const { codec } = defineStoredValue(6);

    expect([codec.decode(4), codec.decode("big")]).toEqual([4, undefined]);
  });

  test("accepts only what its guard accepts", () => {
    const { codec } = defineStoredValue<"red" | "blue">("red", oneOf(["red", "blue"] as const));

    expect([codec.decode("blue"), codec.decode("green")]).toEqual(["blue", undefined]);
  });

  test("uses a codec it is given as is", () => {
    const codec = createSetCodec(isNumber);

    expect(defineStoredValue<ReadonlySet<number>>(new Set(), codec).codec).toBe(codec);
  });
});
