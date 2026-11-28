import { AppRoot, AppRootClass, AppRootConfiguration } from "@/core/ui/app_root/app_root";
import { describe, expect, test } from "vitest";
import { SYSTEM_FONT } from "@/core/ui/fonts/system_font";
import { THEME_DEFINITIONS } from "@/core/ui/theme/theme_definitions";
import TOKENS_CSS from "@/core/ui/tokens.css?inline";
import { VERDANA_FONT } from "@/core/ui/fonts/verdana_font";
import { expectClassesStyled } from "@/testing/css_utilities";

const CONFIGURATION: AppRootConfiguration = { colorScheme: "light", themeDefinition: THEME_DEFINITIONS.slate, appFont: SYSTEM_FONT, styles: [] };

function createAppRoot(partialConfiguration: Partial<AppRootConfiguration> = {}): AppRoot {
  return new AppRoot({ ...CONFIGURATION, ...partialConfiguration }, document);
}

describe("AppRoot", () => {
  test("builds its element inside a shadow root without touching the page", () => {
    const appRoot = createAppRoot();

    expect([appRoot.element.isConnected, (appRoot.element.getRootNode() as ShadowRoot).host.isConnected]).toEqual([false, false]);
    expect(appRoot.element.classList.contains(AppRootClass.root)).toBe(true);
  });

  test("applies the color scheme to its element", () => {
    expect(createAppRoot({ colorScheme: "dark" }).element.style.colorScheme).toBe("dark");
  });

  test("applies the theme to its element", () => {
    const appRoot = createAppRoot({ themeDefinition: THEME_DEFINITIONS.cherry });

    expect(appRoot.element.style.getPropertyValue("--fsg-theme-accent"))
      .toBe(`light-dark(${THEME_DEFINITIONS.cherry.lightColors.accent}, ${THEME_DEFINITIONS.cherry.darkColors.accent})`);
  });

  test("adopts one stylesheet per style", () => {
    const appRoot = createAppRoot({ styles: [".a { color: red; }", ".b { color: blue; }"] });

    expect((appRoot.element.getRootNode() as ShadowRoot).adoptedStyleSheets).toHaveLength(2);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(AppRootClass, TOKENS_CSS);
  });

  describe("mount", () => {
    test("places its shadow host in the container", () => {
      const container = document.createElement("div");
      const appRoot = createAppRoot();

      appRoot.mount(container);
      expect(container.firstElementChild?.shadowRoot?.firstElementChild).toBe(appRoot.element);
    });

    test("installs the font on its element", () => {
      const appRoot = createAppRoot({ appFont: VERDANA_FONT });

      appRoot.mount(document.createElement("div"));
      expect(appRoot.element.style.getPropertyValue("--fsg-font-family")).toBe(VERDANA_FONT.text);
    });
  });
});
