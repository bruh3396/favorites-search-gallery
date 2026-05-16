import { brightWarmCoolHslColor, darkWarmCoolHslColor } from "../../../utils/string/color";
import { SearchTermHighlight } from "../types/highlight";

export function assignColors(highlights: SearchTermHighlight[]): void {
  for (let i = 0; i < highlights.length; i += 1) {
    highlights[i].lightColor = brightWarmCoolHslColor(i, highlights.length);
    highlights[i].darkColor = darkWarmCoolHslColor(i, highlights.length);
  }
}
