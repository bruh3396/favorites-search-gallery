import { describe, expect, test } from "vitest";
import { desugarNestedOrGroups } from "@/lib/search/parsers/nested_or_group_desugarer";

describe("desugarNestedOrGroups", () => {
  test("leaves flat queries untouched", () => {
    expect(desugarNestedOrGroups("apple banana")).toBe("apple banana");
    expect(desugarNestedOrGroups("( apple ~ banana )")).toBe("( apple ~ banana )");
    expect(desugarNestedOrGroups("apple ( banana ~ cherry ) grape")).toBe("apple ( banana ~ cherry ) grape");
    expect(desugarNestedOrGroups("( -apple ~ banana )")).toBe("( -apple ~ banana )");
    expect(desugarNestedOrGroups("")).toBe("");
  });

  test("distributes a nested group over a single term", () => {
    expect(desugarNestedOrGroups("( apple ~ ( banana grape ) )")).toBe("( apple ~ banana ) ( apple ~ grape )");
    expect(desugarNestedOrGroups("( ( banana grape ) ~ apple )")).toBe("( banana ~ apple ) ( grape ~ apple )");
  });

  test("distributes two nested groups", () => {
    expect(desugarNestedOrGroups("( ( a b ) ~ ( c d ) )")).toBe("( a ~ c ) ( a ~ d ) ( b ~ c ) ( b ~ d )");
  });

  test("distributes a nested group of three or four terms", () => {
    expect(desugarNestedOrGroups("( apple ~ ( b c d ) )")).toBe("( apple ~ b ) ( apple ~ c ) ( apple ~ d )");
    expect(desugarNestedOrGroups("( apple ~ ( b c d e ) )")).toBe("( apple ~ b ) ( apple ~ c ) ( apple ~ d ) ( apple ~ e )");
  });

  test("distributes three alternatives", () => {
    expect(desugarNestedOrGroups("( ( a b ) ~ ( c d ) ~ e )")).toBe("( a ~ c ~ e ) ( a ~ d ~ e ) ( b ~ c ~ e ) ( b ~ d ~ e )");
  });

  test("preserves surrounding and terms and sibling groups", () => {
    expect(desugarNestedOrGroups("kiwi ( apple ~ ( banana grape ) )")).toBe("kiwi ( apple ~ banana ) ( apple ~ grape )");
    expect(desugarNestedOrGroups("( apple ~ ( banana grape ) ) ( kiwi ~ mango )")).toBe("( apple ~ banana ) ( apple ~ grape ) ( kiwi ~ mango )");
  });

  test("keeps negation on distributed terms", () => {
    expect(desugarNestedOrGroups("( apple ~ ( -banana grape ) )")).toBe("( apple ~ -banana ) ( apple ~ grape )");
  });

  test("leaves malformed groups untouched", () => {
    expect(desugarNestedOrGroups("( apple ~ ( banana grape )")).toBe("( apple ~ ( banana grape )");
    expect(desugarNestedOrGroups("( apple ~ ( ) )")).toBe("( apple ~ ( ) )");
    expect(desugarNestedOrGroups("( ~ ( banana grape ) )")).toBe("( ~ ( banana grape ) )");
    expect(desugarNestedOrGroups("( apple ( banana grape ) )")).toBe("( apple ( banana grape ) )");
  });
});
