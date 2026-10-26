import { GridLayout } from "@/core/ui/post_grid/grid_layout";

export const GridTilerClass = {
  column: "fsg-GridTiler-column"
} as const;

export interface GridTiling {
  readonly layout: GridLayout;
  readonly columnCount: number;
}

type Arranger = (grid: HTMLElement, tiles: readonly HTMLElement[], columnCount: number) => void;

const ARRANGERS: Record<GridLayout, Arranger> = {
  row: appendInOrder,
  square: appendInOrder,
  grid: appendInOrder,
  column: dealIntoColumns,
  native: appendInOrder
};

export function tileGrid(grid: HTMLElement, tiles: readonly HTMLElement[], { layout, columnCount }: GridTiling): void {
  grid.dataset.layout = layout;
  grid.style.setProperty("--fsg-GridTiler-columnCount", String(columnCount));
  ARRANGERS[layout](grid, tiles, columnCount);
}

function appendInOrder(grid: HTMLElement, tiles: readonly HTMLElement[]): void {
  grid.replaceChildren(...tiles);
}

function dealIntoColumns(grid: HTMLElement, tiles: readonly HTMLElement[], columnCount: number): void {
  const columns = Array.from({ length: columnCount }, () => {
    const column = grid.ownerDocument.createElement("div");

    column.className = GridTilerClass.column;
    return column;
  });

  tiles.forEach((tile, index) => columns[index % columnCount].append(tile));
  grid.replaceChildren(...columns);
}
