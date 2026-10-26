import { AppRootClass, mountAppRoot } from "@/core/ui/app_root/app_root";
import { describe, expect, test } from "vitest";
import { SYSTEM_FONT } from "@/core/ui/fonts/system_font";
import { THEME_DEFINITIONS } from "@/core/ui/theme/theme";
import TOKENS_CSS from "@/core/ui/tokens.css?inline";
import { VERDANA_FONT } from "@/core/ui/fonts/verdana_font";
import { expectClassesStyled } from "@/testing/css";

const THEME = THEME_DEFINITIONS.slate;

describe("mountAppRoot", () => {
  test("mounts the root inside a shadow root on the container", () => {
    const container = document.createElement("div");
    const root = mountAppRoot(container, { colorScheme: "dark", theme: THEME, font: SYSTEM_FONT, styles: [] });

    expect(container.shadowRoot?.firstElementChild).toBe(root);
    expect(root.classList.contains(AppRootClass.root)).toBe(true);
  });

  test("applies the color scheme to the root", () => {
    const root = mountAppRoot(document.createElement("div"), { colorScheme: "light", theme: THEME, font: SYSTEM_FONT, styles: [] });

    expect(root.style.colorScheme).toBe("light");
  });

  test("applies the theme to the root", () => {
    const root = mountAppRoot(document.createElement("div"), { colorScheme: "light", theme: THEME_DEFINITIONS.cherry, font: SYSTEM_FONT, styles: [] });

    expect(root.style.getPropertyValue("--fsg-theme-accent"))
      .toBe(`light-dark(${THEME_DEFINITIONS.cherry.light.accent}, ${THEME_DEFINITIONS.cherry.dark.accent})`);
  });

  test("applies the font to the root", () => {
    const root = mountAppRoot(document.createElement("div"), { colorScheme: "light", theme: THEME, font: VERDANA_FONT, styles: [] });

    expect(root.style.getPropertyValue("--fsg-font-family")).toBe(VERDANA_FONT.text);
  });

  test("adopts one stylesheet per style", () => {
    const container = document.createElement("div");

    mountAppRoot(container, { colorScheme: "dark", theme: THEME, font: SYSTEM_FONT, styles: [".a { color: red; }", ".b { color: blue; }"] });
    expect(container.shadowRoot?.adoptedStyleSheets).toHaveLength(2);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(AppRootClass, TOKENS_CSS);
  });
});
