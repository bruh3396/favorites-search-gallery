import { describe, expect, test } from "vitest";
import { formatKeyLabel } from "@/core/ui/key_bindings/key_label_formatter";

describe("formatKeyLabel", () => {
  test.each([
    [" ", "Space"],
    ["ArrowRight", "→"],
    ["Escape", "Esc"],
    ["Backspace", "Bksp"],
    ["z", "Z"],
    ["/", "/"],
    ["Home", "Home"]
  ])("labels %j as %j", (key, label) => {
    expect(formatKeyLabel(key)).toBe(label);
  });
});
