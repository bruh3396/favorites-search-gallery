export const GRID_LAYOUTS = ["row", "square", "grid", "column", "native"] as const;

export type GridLayout = (typeof GRID_LAYOUTS)[number];
