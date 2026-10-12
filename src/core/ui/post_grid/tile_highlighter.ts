export type TileHighlight = "glow" | "blink" | "sheen";

export function highlightTile(tile: HTMLElement | undefined, highlight: TileHighlight): void {
  if (tile === undefined) {
    return;
  }
  tile.dataset.highlight = highlight;
  tile.addEventListener("animationend", () => delete tile.dataset.highlight, { once: true });
}
