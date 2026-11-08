import { THEME_DEFINITIONS, Theme } from "@/core/ui/theme/theme";
import { describe, expect, onTestFinished, test } from "vitest";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { bindHostAppearance } from "@/core/app/host_appearance_binder";
import { createStoredValue } from "@/testing/stored_value";
import { render } from "@/core/ui/h/h";

function readAccent(appRoot: HTMLElement): string {
  return appRoot.style.getPropertyValue("--fsg-theme-accent");
}

function accentOf(theme: Theme): string {
  const { lightColors: lightThemeColors, darkColors: darkThemeColors } = THEME_DEFINITIONS[theme];
  return `light-dark(${lightThemeColors.accent}, ${darkThemeColors.accent})`;
}

interface Setup {
  appRoot: HTMLElement;
  hostPage: MemoryHostPage;
  theme: StoredValue<Theme>;
  colorScheme: StoredValue<ColorScheme>;
}

function setup(previewedTheme?: Signal<Theme | null>): Setup {
  const appRoot = document.createElement("div");
  const theme = createStoredValue<Theme>("ink");
  const colorScheme = createStoredValue<ColorScheme>("dark");
  const hostPage = new MemoryHostPage();
  const { dispose } = render(document, () => bindHostAppearance(appRoot, { sharedPreferences: { theme, colorScheme }, hostPage, previewedTheme }));

  onTestFinished(dispose);
  return { appRoot, hostPage, theme, colorScheme };
}

describe("bindHostAppearance", () => {
  test("applies the color scheme and theme to the app root", () => {
    const { appRoot } = setup();

    expect([appRoot.style.colorScheme, readAccent(appRoot)]).toEqual(["dark", accentOf("ink")]);
  });

  test("follows a change to the color scheme or theme", () => {
    const { appRoot, theme, colorScheme } = setup();

    colorScheme.set("light");
    theme.set("cherry");
    expect([appRoot.style.colorScheme, readAccent(appRoot)]).toEqual(["light", accentOf("cherry")]);
  });

  test("shows a previewed theme over the stored one until the preview ends", () => {
    const previewedTheme = new Signal<Theme | null>("frost");
    const { appRoot } = setup(previewedTheme);
    const previewedAccent = readAccent(appRoot);

    previewedTheme.value = null;
    expect([previewedAccent, readAccent(appRoot)]).toEqual([accentOf("frost"), accentOf("ink")]);
  });

  test("hands the shown theme to the host page, previewed or stored", () => {
    const previewedTheme = new Signal<Theme | null>("frost");
    const { hostPage, theme } = setup(previewedTheme);
    const previewedThemeDefinition = hostPage.themeDefinition;

    previewedTheme.value = null;
    theme.set("cherry");
    expect([previewedThemeDefinition, hostPage.themeDefinition]).toEqual([THEME_DEFINITIONS.frost, THEME_DEFINITIONS.cherry]);
  });
});
