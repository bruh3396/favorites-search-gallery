import { describe, expect, test } from "vitest";
import { parseDimensions2D, parseJson } from "@/utils/string/parse";

describe("parseDimensions2D", () => {
  const defaultDimensions = { x: 100, y: 100 };

  test("empty", () => {
    expect(parseDimensions2D("")).toStrictEqual(defaultDimensions);
  });

  test("square", () => {
    expect(parseDimensions2D("20x20")).toStrictEqual({ x: 20, y: 20 });
  });

  test("rectangle", () => {
    expect(parseDimensions2D("1920x1080")).toStrictEqual({ x: 1920, y: 1080 });
  });

  test("invalid format", () => {
    expect(parseDimensions2D("20x")).toStrictEqual(defaultDimensions);
  });

  test("invalid format with letters", () => {
    expect(parseDimensions2D("20x20a")).toStrictEqual(defaultDimensions);
  });

  test("invalid format with letters and spaces", () => {
    expect(parseDimensions2D("20x 20a")).toStrictEqual(defaultDimensions);
  });

  test("invalid format with spaces", () => {
    expect(parseDimensions2D("20 x 20")).toStrictEqual(defaultDimensions);
  });

  test("different separator", () => {
    expect(parseDimensions2D("20/20")).toStrictEqual({ x: 20, y: 20 });
  });
});

describe("parseJson", () => {
  test("parses an object", () => {
    expect(parseJson("{\"a\":1}")).toStrictEqual({ a: 1 });
  });

  test("parses an array", () => {
    expect(parseJson("[1,2]")).toStrictEqual([1, 2]);
  });

  test("parses a primitive", () => {
    expect(parseJson("42")).toBe(42);
  });

  test("returns null for malformed json", () => {
    expect(parseJson("{not json")).toBeNull();
  });

  test("returns null for an empty string", () => {
    expect(parseJson("")).toBeNull();
  });
});
