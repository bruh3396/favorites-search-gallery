import { ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { ColumnTiler } from "@/lib/ui/tilers/column_tiler";
import { Content } from "@/app/layout/shell";
import { DomEvents } from "@/app/dom/events";
import { EnhancedWheelEvent } from "@/types/input";
import { Events } from "@/app/channels/events";
import { GridTiler } from "@/lib/ui/tilers/grid_tiler";
import { Layout } from "@/types/ui";
import { NativeTiler } from "@/lib/ui/tilers/native_tiler";
import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { RowTiler } from "@/lib/ui/tilers/row_tiler";
import { SquareTiler } from "@/lib/ui/tilers/square_tiler";
import { ThumbConfig } from "@/config/thumb_config";
import { Timeout } from "@/types/async";
import { clamp } from "@/utils/number";
import { inGallery } from "@/app/channels/feature_bridge";
import { navigationDelta } from "@/utils/navigation";
import { yieldControl } from "@/lib/async/timing";

const FADE_IN_DURATION_MS = 500;
const columnTiler = new ColumnTiler(Content, ON_FAVORITES_PAGE ? Preferences.favoritesColumnCount.value : Preferences.postListColumnCount.value);
const tilers: AbstractTiler[] = [columnTiler, new GridTiler(Content), new RowTiler(Content), new SquareTiler(Content), new NativeTiler(Content)];
const tilerMap = new Map(tilers.map(tiler => [tiler.layout, tiler]));
let currentLayout: Layout = ON_FAVORITES_PAGE ? Preferences.favoritesLayout.value : Preferences.postListLayout.value;
let currentTiler: AbstractTiler = tilerMap.get(currentLayout) ?? columnTiler;
let fadeInEndTimeout: Timeout;

export function setup(): void {
  currentTiler.activate();
  setColumnCount(ON_POST_LIST_PAGE ? Preferences.postListColumnCount.value : Preferences.favoritesColumnCount.value);
  setRowHeight(ON_POST_LIST_PAGE ? Preferences.postListRowHeight.value : Preferences.favoritesRowHeight.value);
  DomEvents.document.wheel.on(changeItemSizeOnShiftScroll);
  Events.app.columnCountChanged.on(setColumnCount);
  Events.app.rowHeightChanged.on(setRowHeight);
  Events.favorites.layoutChanged.on(hideUnusedLayoutSizer);
  Events.postList.layoutChanged.on(hideUnusedLayoutSizer);
}

export function changeLayout(layout: Layout): void {
  if (currentLayout === layout) {
    return;
  }
  currentTiler.deactivate();
  currentLayout = layout;
  currentTiler = tilerMap.get(layout) ?? columnTiler;
  currentTiler.activate();
}

export const setRowHeight = (rowHeight: number): void => tilers.forEach(tiler => tiler.setRowHeight(rowHeight));
export const setColumnCount = (columnCount: number): void => tilers.forEach(tiler => tiler.setColumnCount(columnCount));
export const getLayout = (): Layout => currentLayout;
export const tile = (items: HTMLElement[]): void => fadeInWhile(() => currentTiler.tile(items));
export const addToBottom = (items: HTMLElement[]): void => fadeInWhile(() => currentTiler.addItemsToBottom(items));
export const addToTop = (items: HTMLElement[]): void => fadeInWhile(() => currentTiler.addItemsToTop(items));
export const getBottomEdgeElements = (): HTMLElement[] => currentTiler.getBottomEdgeElements();

export function changeItemSizeOnShiftScroll(wheelEvent: EnhancedWheelEvent): void {
  if (!wheelEvent.originalEvent.shiftKey || currentLayout === "native" || inGallery()) {
    return;
  }
  const usingRowLayout = currentLayout === "row";
  const direction = navigationDelta(wheelEvent.direction);
  const delta = usingRowLayout ? -direction : direction;
  let preference: Preference<number>;

  if (ON_FAVORITES_PAGE) {
    preference = usingRowLayout ? Preferences.favoritesRowHeight : Preferences.favoritesColumnCount;
  } else {
    preference = usingRowLayout ? Preferences.postListRowHeight : Preferences.postListColumnCount;
  }
  const bounds = usingRowLayout ? ThumbConfig.rowHeightBounds : ThumbConfig.columnCountBounds;

  preference.set(clamp(preference.value + delta, bounds.min, bounds.max));

  if (usingRowLayout) {
    setRowHeight(preference.value);
  } else {
    setColumnCount(preference.value);
  }
}

export async function hideUnusedLayoutSizer(layout: Layout): Promise<void> {
  await yieldControl();
  const rowHeightContainer = document.querySelector("#row-size-container, #post-list-row-size");
  const columnCountContainer = document.querySelector("#column-count-container, #post-list-column-count");

  if ((columnCountContainer instanceof HTMLElement) && (rowHeightContainer instanceof HTMLElement)) {
    rowHeightContainer.style.display = layout === "row" ? "" : "none";
    columnCountContainer.style.display = layout === "row" || layout === "native" ? "none" : "";
  }
}

function fadeInWhile(action: () => void): void {
  setDataset(Content, "fading");
  action();
  clearTimeout(fadeInEndTimeout);
  fadeInEndTimeout = setTimeout(() => removeDataset(Content, "fading"), FADE_IN_DURATION_MS);
}
