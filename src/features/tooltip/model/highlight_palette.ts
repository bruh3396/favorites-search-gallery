import { SearchTermHighlight } from "../types/highlight";

export function assignColorsByIndex(highlights: SearchTermHighlight[]): void {
  const total = highlights.length;

  for (let i = 0; i < total; i += 1) {
    const hue = Math.round((i * 360) / Math.max(total, 1));

    highlights[i].color = `hsl(${hue}, 70%, 55%)`;
  }
}
