import {
  camelToKebabCase,
  capitalize,
  decodeHtmlEntities,
  escapeParentheses,
  isEmptyString,
  isOnlyDigits,
  pluralSuffix,
  removeExtraWhitespace,
  removeLeadingModifiers,
  removeNonNumericCharacters,
  replaceSpacesWithUnderscores
} from "@/utils/pure/string";
import { describe, expect, test } from "vitest";

describe("removeExtraWhitespace", () => {
  test("empty", () => {
    expect(removeExtraWhitespace("")).toBe("");
  });

  test("spaces only", () => {
    expect(removeExtraWhitespace("                      ")).toBe("");
  });

  test("single space", () => {
    expect(removeExtraWhitespace(" ")).toBe("");
  });

  test("single word", () => {
    expect(removeExtraWhitespace("hello")).toBe("hello");
  });

  test("multiple spaces", () => {
    expect(removeExtraWhitespace("hello     world")).toBe("hello world");
  });

  test("leading and trailing spaces", () => {
    expect(removeExtraWhitespace("   hello world   ")).toBe("hello world");
  });

  test("remove newlines", () => {
    expect(removeExtraWhitespace("remove extra\n\n\n\nwhitespace")).toBe("remove extra whitespace");
  });
});

describe("escapeParentheses", () => {
  test("empty", () => {
    expect(escapeParentheses("")).toBe("");
  });

  test("one parenthesis", () => {
    expect(escapeParentheses("(")).toBe("\\(");
  });

  test("two parenthesis", () => {
    expect(escapeParentheses("()")).toBe("\\(\\)");
  });

  test("multiple parenthesis", () => {
    expect(escapeParentheses("(a)(b)(c)")).toBe("\\(a\\)\\(b\\)\\(c\\)");
  });

  test("parenthesis with text", () => {
    expect(escapeParentheses("a(b)c")).toBe("a\\(b\\)c");
  });

  test("back to back parenthesis", () => {
    expect(escapeParentheses("()()")).toBe("\\(\\)\\(\\)");
  });
});

describe("removeNonNumeric", () => {
  test("empty", () => {
    expect(removeNonNumericCharacters("")).toBe("");
  });

  test("only letters", () => {
    expect(removeNonNumericCharacters("abc")).toBe("");
  });

  test("only numbers", () => {
    expect(removeNonNumericCharacters("123")).toBe("123");
  });

  test("letters and numbers", () => {
    expect(removeNonNumericCharacters("abc123")).toBe("123");
  });

  test("other", () => {
    expect(removeNonNumericCharacters("P12304")).toBe("12304");
    expect(removeNonNumericCharacters("_!@0#$%^1^&*()2(?:<")).toBe("012");
  });
});

describe("capitalize", () => {
  test("empty", () => {
    expect(capitalize("")).toBe("");
  });

  test("single character", () => {
    expect(capitalize("a")).toBe("A");
    expect(capitalize("A")).toBe("A");
  });

  test("word", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("Hello")).toBe("Hello");
    expect(capitalize("World")).toBe("World");
  });

  test("sentence", () => {
    expect(capitalize("hello world")).toBe("Hello world");
    expect(capitalize("Hello world")).toBe("Hello world");
    expect(capitalize("hello World")).toBe("Hello World");
  });
});

describe("removeLeadingModifiers", () => {
  test("empty", () => {
    expect(removeLeadingModifiers("")).toBe("");
  });

  test("no hyphen", () => {
    expect(removeLeadingModifiers("apple")).toBe("apple");
    expect(removeLeadingModifiers("banana")).toBe("banana");
  });

  test("one hyphen", () => {
    expect(removeLeadingModifiers("-apple")).toBe("apple");
    expect(removeLeadingModifiers("-banana")).toBe("banana");
  });

  test("multiple hyphens", () => {
    expect(removeLeadingModifiers("---apple")).toBe("apple");
    expect(removeLeadingModifiers("--banana")).toBe("banana");
  });
});

test("spacesToUnderscores", () => {
  expect(replaceSpacesWithUnderscores("apple banana cherry")).toBe("apple_banana_cherry");
  expect(replaceSpacesWithUnderscores("apple")).toBe("apple");
  expect(replaceSpacesWithUnderscores("apple banana")).toBe("apple_banana");
  expect(replaceSpacesWithUnderscores("apple_banana_cherry")).toBe("apple_banana_cherry");
});

describe("camelToKebabCase", () => {
  test("empty", () => {
    expect(camelToKebabCase("")).toBe("");
  });

  test("single word", () => {
    expect(camelToKebabCase("surface")).toBe("surface");
  });

  test("two words", () => {
    expect(camelToKebabCase("surfaceSunken")).toBe("surface-sunken");
  });

  test("three words", () => {
    expect(camelToKebabCase("themeSurfaceRaised")).toBe("theme-surface-raised");
  });

  test("leading uppercase", () => {
    expect(camelToKebabCase("ThemeSurface")).toBe("-theme-surface");
  });

  test("consecutive uppercase", () => {
    expect(camelToKebabCase("ariaHTML")).toBe("aria-h-t-m-l");
  });
});

describe("pluralSuffix", () => {
  test("zero", () => {
    expect(pluralSuffix(0)).toBe("s");
  });

  test("one", () => {
    expect(pluralSuffix(1)).toBe("");
  });

  test("many", () => {
    expect(pluralSuffix(2)).toBe("s");
    expect(pluralSuffix(50)).toBe("s");
  });

  test("negative", () => {
    expect(pluralSuffix(-1)).toBe("s");
  });
});

describe("decodeHtmlEntities", () => {
  test("empty", () => {
    expect(decodeHtmlEntities("")).toBe("");
  });

  test("no entities", () => {
    expect(decodeHtmlEntities("baldurs_gate")).toBe("baldurs_gate");
  });

  test("decodes &amp; to ampersand", () => {
    expect(decodeHtmlEntities("rock_&amp;_roll")).toBe("rock_&_roll");
  });

  test("decodes &apos; to apostrophe", () => {
    expect(decodeHtmlEntities("baldur&apos;s_gate")).toBe("baldur's_gate");
  });

  test("decodes &#39; to apostrophe", () => {
    expect(decodeHtmlEntities("baldur&#39;s_gate")).toBe("baldur's_gate");
  });

  test("decodes zero-padded &#039; to apostrophe", () => {
    expect(decodeHtmlEntities("baldur&#039;s_gate")).toBe("baldur's_gate");
  });

  test("decodes multiple entities", () => {
    expect(decodeHtmlEntities("a&amp;b&#39;c&apos;d")).toBe("a&b'c'd");
  });

  test("decodes repeated occurrences of the same entity", () => {
    expect(decodeHtmlEntities("&amp;&amp;")).toBe("&&");
  });

  test("leaves unrelated entities untouched", () => {
    expect(decodeHtmlEntities("a&lt;b&gt;c")).toBe("a&lt;b&gt;c");
  });
});

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
