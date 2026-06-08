import { capitalize, decodeHtmlEntities, escapeParenthesis, negateTags, removeExtraWhiteSpace, removeLeadingHyphens, removeNonNumericCharacters, replaceSpacesWithUnderscores } from "@/utils/string/format";
import { convertToTagSet, convertToTagString } from "@/utils/string/tags";
import { describe, expect, test } from "vitest";
import { isEmptyString, isOnlyDigits } from "@/utils/string/query";
import { parseDimensions2D } from "@/utils/string/parse";

describe("removeExtraWhiteSpace", () => {
  test("empty", () => {
    expect(removeExtraWhiteSpace("")).toBe("");
  });

  test("spaces only", () => {
    expect(removeExtraWhiteSpace("                      ")).toBe("");
  });

  test("single space", () => {
    expect(removeExtraWhiteSpace(" ")).toBe("");
  });

  test("single word", () => {
    expect(removeExtraWhiteSpace("hello")).toBe("hello");
  });

  test("multiple spaces", () => {
    expect(removeExtraWhiteSpace("hello     world")).toBe("hello world");
  });

  test("leading and trailing spaces", () => {
    expect(removeExtraWhiteSpace("   hello world   ")).toBe("hello world");
  });

  test("remove newlines", () => {
    expect(removeExtraWhiteSpace("remove extra\n\n\n\nwhitespace")).toBe("remove extra whitespace");
  });
});

describe("getDimensions2D", () => {
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

describe("escapeParenthesis", () => {
  test("empty", () => {
    expect(escapeParenthesis("")).toBe("");
  });

  test("one parenthesis", () => {
    expect(escapeParenthesis("(")).toBe("\\(");
  });

  test("two parenthesis", () => {
    expect(escapeParenthesis("()")).toBe("\\(\\)");
  });

  test("multiple parenthesis", () => {
    expect(escapeParenthesis("(a)(b)(c)")).toBe("\\(a\\)\\(b\\)\\(c\\)");
  });

  test("parenthesis with text", () => {
    expect(escapeParenthesis("a(b)c")).toBe("a\\(b\\)c");
  });

  test("back to back parenthesis", () => {
    expect(escapeParenthesis("()()")).toBe("\\(\\)\\(\\)");
  });
});

describe("removeNonNumericCharacters", () => {
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

describe("negateTags", () => {
  test("empty", () => {
    expect(negateTags("")).toBe("");
  });

  test("negate", () => {
    expect(negateTags("apple")).toBe("-apple");
    expect(negateTags("apple   ")).toBe("-apple   ");
    expect(negateTags("apple banana")).toBe("-apple -banana");
    expect(negateTags("apple banana cherry")).toBe("-apple -banana -cherry");
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

describe("convertToTagSet", () => {
  test("empty", () => {
    expect(convertToTagSet("")).toStrictEqual(new Set());
  });

  test("single tag", () => {
    expect(convertToTagSet("apple")).toStrictEqual(new Set(["apple"]));
  });

  test("multiple tags", () => {
    expect(convertToTagSet("apple banana cherry")).toStrictEqual(new Set(["apple", "banana", "cherry"]));
  });

  test("extra spaces", () => {
    expect(convertToTagSet("  apple   banana   cherry  ")).toStrictEqual(new Set(["apple", "banana", "cherry"]));
  });

  test("special characters", () => {
    expect(convertToTagSet("apple!@#banana$%^cherry&*()")).toStrictEqual(new Set(["apple!@#banana$%^cherry&*()"]));
  });
});

describe("convertToTagsString", () => {
  test("empty", () => {
    expect(convertToTagString(new Set())).toBe("");
  });

  test("single tag", () => {
    expect(convertToTagString(new Set(["apple"]))).toBe("apple");
  });

  test("multiple tags", () => {
    expect(convertToTagString(new Set(["apple", "banana", "cherry"]))).toBe("apple banana cherry");
  });

  test("special characters", () => {
    expect(convertToTagString(new Set(["apple!@#banana$%^cherry&*()"]))).toBe("apple!@#banana$%^cherry&*()");
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

describe("removeLeadingHyphen", () => {
  test("empty", () => {
    expect(removeLeadingHyphens("")).toBe("");
  });

  test("no hyphen", () => {
    expect(removeLeadingHyphens("apple")).toBe("apple");
    expect(removeLeadingHyphens("banana")).toBe("banana");
  });

  test("one hyphen", () => {
    expect(removeLeadingHyphens("-apple")).toBe("apple");
    expect(removeLeadingHyphens("-banana")).toBe("banana");
  });

  test("multip`le hyphens", () => {
    expect(removeLeadingHyphens("---apple")).toBe("apple");
    expect(removeLeadingHyphens("--banana")).toBe("banana");
  });
});

test("replaceSpacesWithUnderscores", () => {
  expect(replaceSpacesWithUnderscores("apple banana cherry")).toBe("apple_banana_cherry");
  expect(replaceSpacesWithUnderscores("apple")).toBe("apple");
  expect(replaceSpacesWithUnderscores("apple banana")).toBe("apple_banana");
  expect(replaceSpacesWithUnderscores("apple_banana_cherry")).toBe("apple_banana_cherry");

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
