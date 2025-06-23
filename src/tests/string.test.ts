import { capitalize, convertToTagSet, convertToTagString, escapeParenthesis, extractTagGroups, getContentType, getDimensions2D, isEmptyString, isOnlyDigits, negateTags, removeExtraWhiteSpace, removeFirstAndLastLines, removeLeadingHyphens, removeNonNumericCharacters, toCamelCase } from "../utils/primitive/string";
import { describe, expect, test } from "vitest";

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
  const DEFAULT_DIMENSIONS = { width: 100, height: 100 };

  test("empty", () => {
    expect(getDimensions2D("")).toStrictEqual(DEFAULT_DIMENSIONS);
  });

  test("square", () => {
    expect(getDimensions2D("20x20")).toStrictEqual({ width: 20, height: 20 });
  });

  test("rectangle", () => {
    expect(getDimensions2D("1920x1080")).toStrictEqual({ width: 1920, height: 1080 });
  });

  test("invalid format", () => {
    expect(getDimensions2D("20x")).toStrictEqual(DEFAULT_DIMENSIONS);
  });

  test("invalid format with letters", () => {
    expect(getDimensions2D("20x20a")).toStrictEqual(DEFAULT_DIMENSIONS);
  });

  test("invalid format with letters and spaces", () => {
    expect(getDimensions2D("20x 20a")).toStrictEqual(DEFAULT_DIMENSIONS);
  });

  test("invalid format with spaces", () => {
    expect(getDimensions2D("20 x 20")).toStrictEqual(DEFAULT_DIMENSIONS);
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

describe("extractTagGroups", () => {
  function testTagGroups(input: string, expectedOrGroups: string[][], expectedRemainingTags: string[]): void {
    const result = extractTagGroups(input);

    expect(result.orGroups).toStrictEqual(expectedOrGroups);
    expect(result.remainingTags).toStrictEqual(expectedRemainingTags);
  }

  test("empty", () => {
    testTagGroups("", [], []);
    testTagGroups(" ", [], []);
    testTagGroups("\n", [], []);
    testTagGroups("\t", [], []);
  });

  test("only and tags", () => {
    testTagGroups("grape", [], ["grape"]);
    testTagGroups("cherry banana", [], ["cherry", "banana"]);
    testTagGroups("apple orange", [], ["apple", "orange"]);
    testTagGroups("apple orange grape", [], ["apple", "orange", "grape"]);
  });

  test("parenthesis", () => {
    testTagGroups("apple_(red)", [], ["apple_(red)"]);
    testTagGroups("apple_(red) banana", [], ["apple_(red)", "banana"]);
    testTagGroups("apple_(red) banana_(yellow)", [], ["apple_(red)", "banana_(yellow)"]);
    testTagGroups("apple_(red) banana_(yellow) grape", [], ["apple_(red)", "banana_(yellow)", "grape"]);
  });

  test("only groups", () => {
    testTagGroups("( apple )", [["apple"]], []);
    testTagGroups("( apple ) ( banana )", [["apple"], ["banana"]], []);
    testTagGroups("( -apple ) ( banana ) ( -grape )", [["-apple"], ["banana"], ["-grape"]], []);
    testTagGroups("( apple ~ banana )", [["apple", "banana"]], []);
  });

  test("only invalid groups", () => {
    testTagGroups("(apple )", [], ["(apple", ")"]);
    testTagGroups("( apple", [], ["(", "apple"]);
    testTagGroups("apple )", [], ["apple", ")"]);
    testTagGroups("apple (", [], ["apple", "("]);
    testTagGroups("(apple)", [], ["(apple)"]);
  });

  test("both groups", () => {
    testTagGroups("apple ( banana )", [["banana"]], ["apple"]);
    testTagGroups("apple ( banana ) grape", [["banana"]], ["apple", "grape"]);
    testTagGroups("apple ( banana ) grape ( orange )", [["banana"], ["orange"]], ["apple", "grape"]);
    testTagGroups("apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
  });

  test("negated group", () => {
    testTagGroups("-( apple )", [], ["-(", "apple", ")"]);
  });

  test("extra spaces", () => {
    testTagGroups("  apple  ( banana )  grape  ", [["banana"]], ["apple", "grape"]);
    testTagGroups("  apple ( banana ) grape ( orange )  ", [["banana"], ["orange"]], ["apple", "grape"]);
    testTagGroups("  apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi  ", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
    testTagGroups(" apple                  banana    ( cherry )", [["cherry"]], ["apple", "banana"]);
  });
});

describe("getContentType", () => {
  test("empty", () => {
    expect(getContentType("")).toBe("image");
  });

  test("image", () => {
    expect(getContentType("tag1 tag2")).toBe("image");
    expect(getContentType("tag1 ")).toBe("image");
    expect(getContentType("tag1")).toBe("image");
    expect(getContentType("tag1 tag2 tag3")).toBe("image");
  });

  test("video", () => {
    expect(getContentType("tag1 video more_tags tag20")).toBe("video");
    expect(getContentType("video")).toBe("video");
    expect(getContentType("tag1 video")).toBe("video");
    expect(getContentType("video tag2")).toBe("video");
  });

  test("animated", () => {
    expect(getContentType("tag1 tag2 animated")).toBe("gif");
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

describe("removeFirstAndLastLines", () => {
  test("empty", () => {
    expect(removeFirstAndLastLines("")).toBe("");
  });

  test("less than three lines", () => {
    const singleLine = "foo";
    const twoLines = "foo\nbar";

    expect(removeFirstAndLastLines(singleLine)).toBe("");
    expect(removeFirstAndLastLines(twoLines)).toBe("");
  });

  test("iife", () => {
    const code = `() => {
print("Hello, World!");
print("Hello, World!");
print("Hello, Friend!");
}`;

    const expected = `print("Hello, World!");
print("Hello, World!");
print("Hello, Friend!");`;

    expect(removeFirstAndLastLines(code)).toBe(expected);
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

  test("multiple hyphens", () => {
    expect(removeLeadingHyphens("---apple")).toBe("apple");
    expect(removeLeadingHyphens("--banana")).toBe("banana");
  });
});
