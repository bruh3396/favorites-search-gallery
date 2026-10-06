export const GRID_LAYOUTS = ["row", "square", "grid", "column", "native"] as const;

export type GridLayout = (typeof GRID_LAYOUTS)[number];

export const TilerClass = {
  column: "fsg-PostGrid-column"
} as const;

export interface Tiling {
  layout: GridLayout;
  size: number;
}

export interface Arrangement {
  layout: GridLayout;
  getColumnCount: () => number;
}

type Tiler = (root: HTMLElement, tiles: readonly HTMLElement[], getColumnCount: () => number) => void;

const TILERS: Record<GridLayout, Tiler> = {
  row: appendInOrder,
  square: appendInOrder,
  grid: appendInOrder,
  column: dealIntoColumns,
  native: appendInOrder
};

export function applyTiling(root: HTMLElement, { layout, size }: Tiling): void {
  root.dataset.layout = layout;
  root.style.setProperty("--fsg-PostGrid-columns", String(Math.round(size)));
  root.style.setProperty("--fsg-PostGrid-size", String(size));
}

export function arrangeTiles(root: HTMLElement, tiles: readonly HTMLElement[], { layout, getColumnCount }: Arrangement): void {
  TILERS[layout](root, tiles, getColumnCount);
}

function appendInOrder(root: HTMLElement, tiles: readonly HTMLElement[]): void {
  root.replaceChildren(...tiles);
}

function dealIntoColumns(root: HTMLElement, tiles: readonly HTMLElement[], getColumnCount: () => number): void {
  const columnCount = getColumnCount();
  const columns = Array.from({ length: columnCount }, () => {
    const column = root.ownerDocument.createElement("div");

    column.className = TilerClass.column;
    return column;
  });

  tiles.forEach((tile, index) => columns[index % columnCount].append(tile));
  root.replaceChildren(...columns);
}
