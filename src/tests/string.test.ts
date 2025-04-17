import {describe, expect, test} from "vitest";
import {toCamelCase} from "../utils/string";

describe("toCamelCase", () => {
  test("empty", () => {
    expect(toCamelCase("")).toBe("");
  });

  test("one character", () => {
    expect(toCamelCase("a")).toBe("a");
  });

  test("single word", () => {
    expect(toCamelCase("hello")).toBe("hello");
  });

  test("two words", () => {
    expect(toCamelCase("hello_world")).toBe("helloWorld");
  });

  test("multiple words", () => {
    expect(toCamelCase("this_is_a_test")).toBe("thisIsATest");
  });
});
