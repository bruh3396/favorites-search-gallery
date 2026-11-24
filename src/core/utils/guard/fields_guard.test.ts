import { describe, expect, test } from "vitest";
import { createFieldsGuard } from "@/core/utils/guard/fields_guard";
import { createOneOfGuard } from "@/core/utils/guard/one_of_guard";
import { isNumber } from "@/core/utils/guard/unknown_utilities";

describe("createFieldsGuard", () => {
  const isSize = createFieldsGuard({ unit: createOneOfGuard(["px", "em"] as const), amount: isNumber });

  test("accepts an object whose every field its guard accepts", () => {
    expect(isSize({ unit: "px", amount: 4 })).toBe(true);
  });

  test.each([
    ["a field its guard rejects", { unit: "pt", amount: 4 }],
    ["a missing field", { unit: "px" }],
    ["a non-object", "px"]
  ])("rejects %s", (_, raw) => {
    expect(isSize(raw)).toBe(false);
  });
});
