import { capitalize, decodeHtmlEntities, escapeParenthesis, negateTags, removeExtraWhiteSpace, removeLeadingHyphens, removeNonNumericCharacters, replaceSpacesWithUnderscores } from "@/utils/string/format";
import { describe, expect, test } from "vitest";

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

describe("removeLeadingHyphens", () => {
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

  test("multiple hyphens", () => {
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
