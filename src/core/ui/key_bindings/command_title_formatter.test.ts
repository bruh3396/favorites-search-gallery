import { describe, expect, test } from "vitest";
import { formatCommandTitle } from "@/core/ui/key_bindings/command_title_formatter";

describe("formatCommandTitle", () => {
  test.each<[string, readonly string[], string]>([
    ["Download", ["s"], "Download (S)"],
    ["Show Next", ["ArrowRight", "d"], "Show Next (→)"],
    ["Open Original", [], "Open Original"]
  ])("titles %s bound to %j", (label, keys, expected) => {
    expect(formatCommandTitle(label, keys)).toBe(expected);
  });
});
