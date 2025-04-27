import {FavoriteLayout} from "../../../../types/primitives/primitives";

export interface Tiler {
  container: HTMLElement
  className: FavoriteLayout

  tile: (items: HTMLElement[]) => void
  setColumnCount: (columnCount: number) => void
  setRowSize: (rowSize: number) => void
  onActivation: () => void
  onDeactivation: () => void
  addItemsToTop: (items: HTMLElement[]) => void
  addItemsToBottom: (items: HTMLElement[]) => void
  showSkeleton: () => void
}
