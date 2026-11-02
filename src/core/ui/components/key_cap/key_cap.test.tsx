import { KeyCap, KeyCapClass } from "@/core/ui/components/key_cap/key_cap";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import KEY_CAP_CSS from "@/core/ui/components/key_cap/key_cap.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("KeyCap", () => {
  test("shows the key", () => {
    expect(render(document, () => <KeyCap label="Esc" />).result.textContent).toBe("Esc");
  });

  test("marks the key as keyboard input for assistive technology", () => {
    expect(render(document, () => <KeyCap label="Esc" />).result.tagName).toBe("KBD");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(KeyCapClass, KEY_CAP_CSS);
  });
});
