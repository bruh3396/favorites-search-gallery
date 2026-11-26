import { GridLayout } from "@/core/ui/post_grid/layout/grid_layout";

export interface GridSizing {
  readonly layout: GridLayout;
  readonly columnCount: number;
  readonly gridWidth: number;
}
