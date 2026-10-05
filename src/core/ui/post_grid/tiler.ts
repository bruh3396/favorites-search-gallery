export const LAYOUTS = ["row", "square", "grid", "column", "native"] as const;

export type Layout = (typeof LAYOUTS)[number];

export const TilerClass = {
  column: "fsg-PostGrid-column"
} as const;

export interface Tiling {
  layout: Layout;
  columnCount: number;
  rowHeightViewportPercent: number;
}

type Tiler = (root: HTMLElement, tiles: readonly HTMLElement[], columnCount: number) => void;

const TILERS: Record<Layout, Tiler> = {
  row: appendInOrder,
  square: appendInOrder,
  grid: appendInOrder,
  column: dealIntoColumns,
  native: appendInOrder
};

export function applyTiling(root: HTMLElement, { layout, columnCount, rowHeightViewportPercent }: Tiling): void {
  root.dataset.layout = layout;
  root.style.setProperty("--fsg-PostGrid-columns", String(columnCount));
  root.style.setProperty("--fsg-PostGrid-row-height", `${rowHeightViewportPercent}vw`);
}

export function arrangeTiles(root: HTMLElement, tiles: readonly HTMLElement[], { layout, columnCount }: Pick<Tiling, "layout" | "columnCount">): void {
  TILERS[layout](root, tiles, columnCount);
}

function appendInOrder(root: HTMLElement, tiles: readonly HTMLElement[]): void {
  root.replaceChildren(...tiles);
}

function dealIntoColumns(root: HTMLElement, tiles: readonly HTMLElement[], columnCount: number): void {
  const columns = Array.from({ length: columnCount }, () => {
    const column = root.ownerDocument.createElement("div");

    column.className = TilerClass.column;
    return column;
  });

  tiles.forEach((tile, index) => columns[index % columnCount].append(tile));
  root.replaceChildren(...columns);
}
