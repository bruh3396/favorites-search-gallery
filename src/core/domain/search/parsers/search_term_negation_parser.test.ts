import { describe, expect, test } from "vitest";
import { parseSearchTermNegation } from "@/core/domain/search/parsers/search_term_negation_parser";

describe("parseSearchTermNegation", () => {
  test("strips a leading minus and marks the term negated", () => {
    expect(parseSearchTermNegation("-mango")).toEqual({ isNegated: true, value: "mango" });
  });

  test("leaves a term without a minus unchanged", () => {
    expect(parseSearchTermNegation("mango")).toEqual({ isNegated: false, value: "mango" });
  });

  test("treats a lone minus as a plain term", () => {
    expect(parseSearchTermNegation("-")).toEqual({ isNegated: false, value: "-" });
  });
});
