import { DEFAULT_THEME, THEME_DEFINITIONS } from "@/core/ui/theme/theme";
import { ColorScheme } from "@/core/boundary/environment";
import { INSTRUMENT_FONT } from "@/core/ui/fonts/instrument_font";
import LAB_CSS from "@/targets/lab/styles.css?inline";
import UI_CSS from "@/core/ui/styles.css?inline";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export function mountLabRoot(container: HTMLElement, colorScheme: ColorScheme): HTMLElement {
  return mountAppRoot(container, { colorScheme, themeDefinition: THEME_DEFINITIONS[DEFAULT_THEME], appFont: INSTRUMENT_FONT, styles: [UI_CSS, LAB_CSS] });
}
