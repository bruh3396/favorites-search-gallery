import { DEFAULT_THEME, THEMES } from "@/core/ui/theme/theme";
import { describe, expect, test } from "vitest";

describe("DEFAULT_THEME", () => {
  test("names one of THEMES", () => {
    expect(THEMES).toContain(DEFAULT_THEME);
  });
});
