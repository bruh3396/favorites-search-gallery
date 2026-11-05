import { describe, expect, test } from "vitest";
import { isSearchExpressionOperator } from "@/core/domain/search/parsers/search_expression_operator";

describe("isSearchExpressionOperator", () => {
  test.each(["(", "-(", ")", "~"])("recognizes %s", word => {
    expect(isSearchExpressionOperator(word)).toBe(true);
  });

  test.each(["cat", "(cat", "-", ""])("rejects '%s'", word => {
    expect(isSearchExpressionOperator(word)).toBe(false);
  });
});
