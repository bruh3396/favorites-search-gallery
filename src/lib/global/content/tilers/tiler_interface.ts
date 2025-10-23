import { Layout } from "../../../../types/common_types";

export interface Tiler {
  readonly container: HTMLElement
  readonly className: Layout

  tile: (items: HTMLElement[]) => void
  setColumnCount: (columnCount: number) => void
  setRowSize: (rowSize: number) => void
  onActivate: () => void
  onDeactivate: () => void
  addItemsToTop: (items: HTMLElement[]) => void
  addItemsToBottom: (items: HTMLElement[]) => void
  showSkeleton: () => void
  skeletonStyle: Record<string, string>
}
