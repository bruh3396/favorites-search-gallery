import { describe, expect, test } from "vitest";
import { createOneOfGuard } from "@/core/utils/guard/one_of_guard";

describe("createOneOfGuard", () => {
  test("accepts only members", () => {
    expect(["row", "grid", 1].map(createOneOfGuard(["row", "column"]))).toEqual([true, false, false]);
  });
});
