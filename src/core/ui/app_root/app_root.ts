import { AppFont, installAppFont } from "@/core/ui/fonts/app_font";
import { ThemeDefinition, applyTheme } from "@/core/ui/theme/themes";
import { ColorScheme } from "@/core/boundary/environment";

export const AppRootClass = {
  root: "fsg-App"
} as const;

export interface AppRootProps {
  colorScheme: ColorScheme;
  theme: ThemeDefinition;
  font: AppFont;
  styles: readonly string[];
}

export function mountAppRoot(container: HTMLElement, { colorScheme, theme, font, styles }: AppRootProps): HTMLElement {
  const shadowRoot = container.attachShadow({ mode: "open" });
  const root = container.ownerDocument.createElement("div");

  root.className = AppRootClass.root;
  root.style.colorScheme = colorScheme;
  applyTheme(root, theme);
  installAppFont(root, font);
  shadowRoot.adoptedStyleSheets = styles.map(createStyleSheet);
  shadowRoot.append(root);
  return root;
}

function createStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(css);
  return sheet;
}
