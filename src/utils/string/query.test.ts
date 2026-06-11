import { describe, expect, test } from "vitest";
import { isEmptyString, isOnlyDigits } from "@/utils/string/query";

describe("isEmptyString", () => {
  test("empty", () => {
    expect(isEmptyString("")).toBe(true);
  });

  test("single space", () => {
    expect(isEmptyString(" ")).toBe(true);
  });

  test("multiple spaces", () => {
    expect(isEmptyString("   ")).toBe(true);
  });

  test("non-space character", () => {
    expect(isEmptyString("a")).toBe(false);
  });

  test("word", () => {
    expect(isEmptyString("apple")).toBe(false);
  });

  test("sentence", () => {
    expect(isEmptyString("apple pie")).toBe(false);
  });

  test("tab character", () => {
    expect(isEmptyString("\t")).toBe(true);
  });

  test("newline character", () => {
    expect(isEmptyString("\n")).toBe(true);
  });
});

describe("isOnlyDigits", () => {
  test("empty", () => {
    expect(isOnlyDigits("")).toBe(false);
  });

  test("only digits", () => {
    expect(isOnlyDigits("123")).toBe(true);
    expect(isOnlyDigits("1849202")).toBe(true);
    expect(isOnlyDigits("1234567890")).toBe(true);
  });

  test("letters and digits", () => {
    expect(isOnlyDigits("123abc")).toBe(false);
    expect(isOnlyDigits("abc123")).toBe(false);
    expect(isOnlyDigits("1a2b3c")).toBe(false);
  });

  test("special characters", () => {
    expect(isOnlyDigits("123!@#")).toBe(false);
    expect(isOnlyDigits("!@#123")).toBe(false);
    expect(isOnlyDigits("1!2@3#")).toBe(false);
  });
});
