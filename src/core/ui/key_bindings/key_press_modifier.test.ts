import { describe, expect, test } from "vitest";
import { listHeldKeyPressModifiers } from "@/core/ui/key_bindings/key_press_modifier";

describe("listHeldKeyPressModifiers", () => {
  test("lists held modifiers in a fixed order", () => {
    expect(listHeldKeyPressModifiers({ metaKey: true, altKey: true, ctrlKey: true })).toEqual(["Ctrl", "Alt", "Meta"]);
  });

  test("returns nothing when no modifier is held", () => {
    expect(listHeldKeyPressModifiers({ metaKey: false, altKey: false, ctrlKey: false })).toEqual([]);
  });
});
