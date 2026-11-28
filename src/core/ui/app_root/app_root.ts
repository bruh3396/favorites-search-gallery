import { AppFont } from "@/core/ui/fonts/app_font";
import { ColorScheme } from "@/core/boundary/environment/color_scheme";
import { ThemeDefinition } from "@/core/ui/theme/theme_definition";
import { applyTheme } from "@/core/ui/theme/theme_applier";
import { installAppFont } from "@/core/ui/fonts/app_font_installer";

export const AppRootClass = {
  root: "fsg-App"
} as const;

export interface AppRootConfiguration {
  readonly colorScheme: ColorScheme;
  readonly themeDefinition: ThemeDefinition;
  readonly appFont: AppFont;
  readonly styles: readonly string[];
}

export class AppRoot {
  public readonly element: HTMLElement;
  readonly #host: HTMLElement;

  constructor(private readonly configuration: AppRootConfiguration, document: Document) {
    const { colorScheme, themeDefinition, styles } = configuration;
    const shadowRoot = (this.#host = document.createElement("div")).attachShadow({ mode: "open" });

    this.element = document.createElement("div");
    this.element.className = AppRootClass.root;
    this.element.style.colorScheme = colorScheme;
    applyTheme(this.element, themeDefinition);
    shadowRoot.adoptedStyleSheets = styles.map(createStyleSheet);
    shadowRoot.append(this.element);
  }

  public mount(container: HTMLElement): void {
    installAppFont(this.element, this.configuration.appFont);
    container.append(this.#host);
  }
}

function createStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(css);
  return sheet;
}
