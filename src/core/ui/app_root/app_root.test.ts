import { AppRootClass, mountAppRoot } from "@/core/ui/app_root/app_root";
import { describe, expect, test } from "vitest";
import { SYSTEM_FONT } from "@/core/ui/fonts/system";
import TOKENS_CSS from "@/core/ui/tokens.css?inline";
import { VERDANA_FONT } from "@/core/ui/fonts/verdana";
import { expectClassesStyled } from "@/testing/css";

describe("mountAppRoot", () => {
  test("mounts the root inside a shadow root on the container", () => {
    const container = document.createElement("div");
    const root = mountAppRoot(container, { colorScheme: "dark", font: SYSTEM_FONT, styles: [] });

    expect(container.shadowRoot?.firstElementChild).toBe(root);
    expect(root.classList.contains(AppRootClass.root)).toBe(true);
  });

  test("applies the color scheme to the root", () => {
    const root = mountAppRoot(document.createElement("div"), { colorScheme: "light", font: SYSTEM_FONT, styles: [] });

    expect(root.style.colorScheme).toBe("light");
  });

  test("applies the font to the root", () => {
    const root = mountAppRoot(document.createElement("div"), { colorScheme: "light", font: VERDANA_FONT, styles: [] });

    expect(root.style.getPropertyValue("--fsg-font-family")).toBe(VERDANA_FONT.text);
  });

  test("adopts one stylesheet per style", () => {
    const container = document.createElement("div");

    mountAppRoot(container, { colorScheme: "dark", font: SYSTEM_FONT, styles: [".a { color: red; }", ".b { color: blue; }"] });
    expect(container.shadowRoot?.adoptedStyleSheets).toHaveLength(2);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(AppRootClass, TOKENS_CSS);
  });
});
