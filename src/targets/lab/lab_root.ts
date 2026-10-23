import { ColorScheme } from "@/core/boundary/environment";
import { INSTRUMENT_FONT } from "@/core/ui/fonts/instrument";
import LAB_CSS from "@/targets/lab/lab.css?inline";
import UI_CSS from "@/core/ui/styles.css?inline";
import { mountAppRoot } from "@/core/ui/app_root/app_root";

export function mountLabRoot(container: HTMLElement, colorScheme: ColorScheme): HTMLElement {
  return mountAppRoot(container, { colorScheme, font: INSTRUMENT_FONT, styles: [UI_CSS, LAB_CSS] });
}
