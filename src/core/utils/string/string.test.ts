import {
    camelToKebabCase,
    capitalize,
    compareStrings,
    copyString,
    decodeHtmlEntities,
    escapeParentheses,
    isEmptyString,
    isOnlyDigits,
    pluralSuffix,
    removeExtraWhitespace,
    removeLeadingModifiers,
    removeNonNumericCharacters,
    replaceSpacesWithUnderscores,
    snakeToCamelCase,
    toLowerUnderscored,
    trigramsOf
} from "@/core/utils/string/string";
import { describe, expect, test } from "vitest";

describe("toLowerUnderscored", () => {
  test("lowercases", () => {
    expect(toLowerUnderscored("Fruits")).toBe("fruits");
  });

  test("replaces spaces with underscores", () => {
    expect(toLowerUnderscored("my fruits")).toBe("my_fruits");
  });

  test("collapses repeated whitespace before replacing", () => {
    expect(toLowerUnderscored("  my   fruits  ")).toBe("my_fruits");
  });

  test("leaves an already underscored name alone", () => {
    expect(toLowerUnderscored("my_fruits")).toBe("my_fruits");
  });
});

describe("removeExtraWhitespace", () => {
  test("keeps an empty string", () => {
    expect(removeExtraWhitespace("")).toBe("");
  });

  test("empties a string of only spaces", () => {
    expect(removeExtraWhitespace("                      ")).toBe("");
  });

  test("empties a single space", () => {
    expect(removeExtraWhitespace(" ")).toBe("");
  });

  test("keeps a single word", () => {
    expect(removeExtraWhitespace("hello")).toBe("hello");
  });

  test("collapses multiple spaces", () => {
    expect(removeExtraWhitespace("hello     world")).toBe("hello world");
  });

  test("trims leading and trailing spaces", () => {
    expect(removeExtraWhitespace("   hello world   ")).toBe("hello world");
  });

  test("replaces newlines with a space", () => {
    expect(removeExtraWhitespace("remove extra\n\n\n\nwhitespace")).toBe("remove extra whitespace");
  });
});

describe("escapeParentheses", () => {
  test("keeps an empty string", () => {
    expect(escapeParentheses("")).toBe("");
  });

  test("escapes one parenthesis", () => {
    expect(escapeParentheses("(")).toBe("\\(");
  });

  test("escapes a pair of parentheses", () => {
    expect(escapeParentheses("()")).toBe("\\(\\)");
  });

  test("escapes multiple parentheses", () => {
    expect(escapeParentheses("(a)(b)(c)")).toBe("\\(a\\)\\(b\\)\\(c\\)");
  });

  test("escapes parentheses around text", () => {
    expect(escapeParentheses("a(b)c")).toBe("a\\(b\\)c");
  });

  test("escapes back-to-back parentheses", () => {
    expect(escapeParentheses("()()")).toBe("\\(\\)\\(\\)");
  });
});

describe("removeNonNumericCharacters", () => {
  test("keeps an empty string", () => {
    expect(removeNonNumericCharacters("")).toBe("");
  });

  test("removes every letter", () => {
    expect(removeNonNumericCharacters("abc")).toBe("");
  });

  test("keeps only numbers", () => {
    expect(removeNonNumericCharacters("123")).toBe("123");
  });

  test("keeps the numbers among letters", () => {
    expect(removeNonNumericCharacters("abc123")).toBe("123");
  });

  test("keeps the numbers among symbols", () => {
    expect(removeNonNumericCharacters("P12304")).toBe("12304");
    expect(removeNonNumericCharacters("_!@0#$%^1^&*()2(?:<")).toBe("012");
  });
});

describe("capitalize", () => {
  test("keeps an empty string", () => {
    expect(capitalize("")).toBe("");
  });

  test("capitalizes a single character", () => {
    expect(capitalize("a")).toBe("A");
    expect(capitalize("A")).toBe("A");
  });

  test("capitalizes a word", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("Hello")).toBe("Hello");
    expect(capitalize("World")).toBe("World");
  });

  test("capitalizes only the first word of a sentence", () => {
    expect(capitalize("hello world")).toBe("Hello world");
    expect(capitalize("Hello world")).toBe("Hello world");
    expect(capitalize("hello World")).toBe("Hello World");
  });
});

describe("removeLeadingModifiers", () => {
  test("keeps an empty string", () => {
    expect(removeLeadingModifiers("")).toBe("");
  });

  test("keeps a tag without a hyphen", () => {
    expect(removeLeadingModifiers("apple")).toBe("apple");
    expect(removeLeadingModifiers("banana")).toBe("banana");
  });

  test("removes one leading hyphen", () => {
    expect(removeLeadingModifiers("-apple")).toBe("apple");
    expect(removeLeadingModifiers("-banana")).toBe("banana");
  });

  test("removes multiple leading hyphens", () => {
    expect(removeLeadingModifiers("---apple")).toBe("apple");
    expect(removeLeadingModifiers("--banana")).toBe("banana");
  });
});

describe("replaceSpacesWithUnderscores", () => {
  test("replaces every space with an underscore", () => {
    expect(replaceSpacesWithUnderscores("apple banana cherry")).toBe("apple_banana_cherry");
    expect(replaceSpacesWithUnderscores("apple")).toBe("apple");
    expect(replaceSpacesWithUnderscores("apple banana")).toBe("apple_banana");
    expect(replaceSpacesWithUnderscores("apple_banana_cherry")).toBe("apple_banana_cherry");
  });
});

describe("compareStrings", () => {
  test("returns -1 when the first string sorts first", () => {
    expect(compareStrings("apple", "banana")).toBe(-1);
  });

  test("returns 1 when the first string sorts last", () => {
    expect(compareStrings("banana", "apple")).toBe(1);
  });

  test("returns 0 for equal strings", () => {
    expect(compareStrings("apple", "apple")).toBe(0);
  });

  test("sorts a prefix first", () => {
    expect(compareStrings("app", "apple")).toBe(-1);
  });

  test("orders by code unit, not locale", () => {
    expect(compareStrings("Z", "a")).toBe(-1);
  });

  test("sorts an array", () => {
    expect(["c", "a", "b", "a"].sort(compareStrings)).toEqual(["a", "a", "b", "c"]);
  });
});

describe("snakeToCamelCase", () => {
  test("keeps an empty string", () => {
    expect(snakeToCamelCase("")).toBe("");
  });

  test("keeps a single word", () => {
    expect(snakeToCamelCase("surface")).toBe("surface");
  });

  test("joins multiple words in camel case", () => {
    expect(snakeToCamelCase("theme_surface_raised")).toBe("themeSurfaceRaised");
  });

  test("keeps an underscore before a non-lowercase character", () => {
    expect(snakeToCamelCase("a_1_B")).toBe("a_1_B");
  });

  test("keeps a trailing underscore", () => {
    expect(snakeToCamelCase("surface_")).toBe("surface_");
  });
});

describe("copyString", () => {
  test("copies an empty string", () => {
    expect(copyString("")).toBe("");
  });

  test("returns a string equal to the original", () => {
    expect(copyString("baldurs_gate")).toBe("baldurs_gate");
  });

  test("preserves surrogate pairs", () => {
    expect(copyString("a😀b")).toBe("a😀b");
  });
});

describe("camelToKebabCase", () => {
  test("keeps an empty string", () => {
    expect(camelToKebabCase("")).toBe("");
  });

  test("keeps a single word", () => {
    expect(camelToKebabCase("surface")).toBe("surface");
  });

  test("hyphenates two words", () => {
    expect(camelToKebabCase("surfaceSunken")).toBe("surface-sunken");
  });

  test("hyphenates three words", () => {
    expect(camelToKebabCase("themeSurfaceRaised")).toBe("theme-surface-raised");
  });

  test("prefixes a hyphen for a leading uppercase letter", () => {
    expect(camelToKebabCase("ThemeSurface")).toBe("-theme-surface");
  });

  test("hyphenates each consecutive uppercase letter", () => {
    expect(camelToKebabCase("ariaHTML")).toBe("aria-h-t-m-l");
  });
});

describe("pluralSuffix", () => {
  test("returns s for zero", () => {
    expect(pluralSuffix(0)).toBe("s");
  });

  test("returns nothing for one", () => {
    expect(pluralSuffix(1)).toBe("");
  });

  test("returns s for many", () => {
    expect(pluralSuffix(2)).toBe("s");
    expect(pluralSuffix(50)).toBe("s");
  });

  test("returns s for a negative count", () => {
    expect(pluralSuffix(-1)).toBe("s");
  });
});

describe("isEmptyString", () => {
  test("returns true for an empty string", () => {
    expect(isEmptyString("")).toBe(true);
  });

  test("returns true for a single space", () => {
    expect(isEmptyString(" ")).toBe(true);
  });

  test("returns true for multiple spaces", () => {
    expect(isEmptyString("   ")).toBe(true);
  });

  test("returns false for a non-space character", () => {
    expect(isEmptyString("a")).toBe(false);
  });

  test("returns false for a word", () => {
    expect(isEmptyString("apple")).toBe(false);
  });

  test("returns false for a sentence", () => {
    expect(isEmptyString("apple pie")).toBe(false);
  });

  test("returns true for a tab", () => {
    expect(isEmptyString("\t")).toBe(true);
  });

  test("returns true for a newline", () => {
    expect(isEmptyString("\n")).toBe(true);
  });
});

describe("trigramsOf", () => {
  test("returns nothing for an empty string", () => {
    expect(trigramsOf("")).toEqual([]);
  });

  test("returns nothing for fewer than three characters", () => {
    expect(trigramsOf("ab")).toEqual([]);
  });

  test("returns the string itself for exactly three characters", () => {
    expect(trigramsOf("fig")).toEqual(["fig"]);
  });

  test("slides a three-character window across the string", () => {
    expect(trigramsOf("banana")).toEqual(["ban", "ana", "nan", "ana"]);
  });
});

describe("isOnlyDigits", () => {
  test("returns false for an empty string", () => {
    expect(isOnlyDigits("")).toBe(false);
  });

  test("returns true for only digits", () => {
    expect(isOnlyDigits("123")).toBe(true);
    expect(isOnlyDigits("1849202")).toBe(true);
    expect(isOnlyDigits("1234567890")).toBe(true);
  });

  test("returns false for letters and digits", () => {
    expect(isOnlyDigits("123abc")).toBe(false);
    expect(isOnlyDigits("abc123")).toBe(false);
    expect(isOnlyDigits("1a2b3c")).toBe(false);
  });

  test("returns false for special characters", () => {
    expect(isOnlyDigits("123!@#")).toBe(false);
    expect(isOnlyDigits("!@#123")).toBe(false);
    expect(isOnlyDigits("1!2@3#")).toBe(false);
  });
});

describe("decodeHtmlEntities", () => {
  test("returns an empty string unchanged", () => {
    expect(decodeHtmlEntities("")).toBe("");
  });

  test("leaves text without entities unchanged", () => {
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
