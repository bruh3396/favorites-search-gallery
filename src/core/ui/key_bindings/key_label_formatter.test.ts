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
    ["Home", "Home"],
    ["Ctrl+k", "Ctrl+K"],
    ["Ctrl+ArrowRight", "Ctrl+→"],
    ["Ctrl+Alt+Meta+ ", "Ctrl+Alt+Meta+Space"],
    ["+", "+"],
    ["Ctrl++", "Ctrl++"]
  ])("labels %j as %j", (key, label) => {
    expect(formatKeyLabel(key)).toBe(label);
  });
});
