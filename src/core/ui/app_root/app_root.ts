import { AppFont } from "@/core/ui/fonts/app_font";
import { installAppFont } from "@/core/ui/fonts/app_font_installer";
import { ThemeDefinition } from "@/core/ui/theme/theme";
import { applyTheme } from "@/core/ui/theme/theme_applier";
import { ColorScheme } from "@/core/boundary/color_scheme";

export const AppRootClass = {
  root: "fsg-App"
} as const;

export interface AppRootProps {
  colorScheme: ColorScheme;
  themeDefinition: ThemeDefinition;
  appFont: AppFont;
  styles: readonly string[];
}

export function mountAppRoot(container: HTMLElement, { colorScheme, themeDefinition, appFont, styles }: AppRootProps): HTMLElement {
  const shadowRoot = container.attachShadow({ mode: "open" });
  const root = container.ownerDocument.createElement("div");

  root.className = AppRootClass.root;
  root.style.colorScheme = colorScheme;
  applyTheme(root, themeDefinition);
  installAppFont(root, appFont);
  shadowRoot.adoptedStyleSheets = styles.map(createStyleSheet);
  shadowRoot.append(root);
  return root;
}

function createStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(css);
  return sheet;
}
