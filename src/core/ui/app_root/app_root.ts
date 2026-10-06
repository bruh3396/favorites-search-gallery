import { ColorScheme } from "@/core/boundary/environment";

export const AppRootClass = {
  root: "fsg-App"
} as const;

export interface AppRootOptions {
  colorScheme: ColorScheme;
  styles: readonly string[];
}

export function mountAppRoot(container: HTMLElement, { colorScheme, styles }: AppRootOptions): HTMLElement {
  const shadowRoot = container.attachShadow({ mode: "open" });
  const root = container.ownerDocument.createElement("div");

  root.className = AppRootClass.root;
  root.style.colorScheme = colorScheme;
  shadowRoot.adoptedStyleSheets = styles.map(createStyleSheet);
  shadowRoot.append(root);
  return root;
}

function createStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(css);
  return sheet;
}
