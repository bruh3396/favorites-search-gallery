import { definePreference, defineRecordPreference } from "@/core/utils/preference/preference_definition";
import { describe, expect, test } from "vitest";
import { isBoolean, isNumber, oneOf } from "@/core/utils/guard/guard";

describe("definePreference", () => {
  test("accepts only values of the default's kind when given no guard", () => {
    const { codec } = definePreference(6);

    expect([codec.decode(4), codec.decode("big")]).toEqual([4, undefined]);
  });

  test("accepts only what its guard accepts", () => {
    const { codec } = definePreference<"red" | "blue">("red", oneOf(["red", "blue"] as const));

    expect([codec.decode("blue"), codec.decode("green")]).toEqual(["blue", undefined]);
  });
});

describe("defineRecordPreference", () => {
  test("decodes each rejected field as its default", () => {
    const { codec } = defineRecordPreference({ size: 6, isOpen: false }, { size: isNumber, isOpen: isBoolean });

    expect(codec.decode({ size: "big", isOpen: true })).toEqual({ size: 6, isOpen: true });
  });
});
