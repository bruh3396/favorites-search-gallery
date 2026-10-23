import { AppFont, installAppFont } from "@/core/ui/fonts/app_font";
import { ColorScheme } from "@/core/boundary/environment";

export const AppRootClass = {
  root: "fsg-App"
} as const;

export interface AppRootProps {
  colorScheme: ColorScheme;
  font: AppFont;
  styles: readonly string[];
}

export function mountAppRoot(container: HTMLElement, { colorScheme, font, styles }: AppRootProps): HTMLElement {
  const shadowRoot = container.attachShadow({ mode: "open" });
  const root = container.ownerDocument.createElement("div");

  root.className = AppRootClass.root;
  root.style.colorScheme = colorScheme;
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
