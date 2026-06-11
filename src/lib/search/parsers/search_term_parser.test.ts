import { describe, expect, test } from "vitest";
import { hasMetadataTerm } from "@/lib/search/parsers/search_term_parser";

describe("hasMetadataTerm", () => {
  test("no metadata term", () => {
    expect(hasMetadataTerm("")).toBe(false);
    expect(hasMetadataTerm("   ")).toBe(false);
    expect(hasMetadataTerm("apple")).toBe(false);
    expect(hasMetadataTerm("apple sweet")).toBe(false);
    expect(hasMetadataTerm("app* sweet")).toBe(false);
    expect(hasMetadataTerm("( apple ~ banana ) sweet")).toBe(false);
  });

  test("single metadata term", () => {
    expect(hasMetadataTerm("score:>50")).toBe(true);
    expect(hasMetadataTerm("width:height")).toBe(true);
    expect(hasMetadataTerm("-id:<100")).toBe(true);
  });

  test("metadata term among other terms", () => {
    expect(hasMetadataTerm("score:>50 sweet")).toBe(true);
    expect(hasMetadataTerm("sweet score:>50")).toBe(true);
    expect(hasMetadataTerm("apple sweet duration:<10 sour")).toBe(true);
  });

  test("metadata term inside an or group", () => {
    expect(hasMetadataTerm("( score:>50 ~ apple ) sweet")).toBe(true);
    expect(hasMetadataTerm("( apple ~ height:>500 )")).toBe(true);
  });

  test("every metric and comparator", () => {
    for (const metric of ["width", "height", "id", "score", "duration"]) {
      for (const comparator of [":", ":<", ":>"]) {
        expect(hasMetadataTerm(`apple ${metric}${comparator}0 sweet`)).toBe(true);
        expect(hasMetadataTerm(`apple ${metric}${comparator}${metric} sweet`)).toBe(true);
      }
    }
  });

  test("near misses are not metadata terms", () => {
    expect(hasMetadataTerm("apple:>50")).toBe(false);
    expect(hasMetadataTerm("score:>banana")).toBe(false);
    expect(hasMetadataTerm("scorewidth:>50")).toBe(false);
  });
});
