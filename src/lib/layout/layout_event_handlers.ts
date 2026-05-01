import * as LayoutManager from "./layout";
import { EnhancedWheelEvent } from "../dom/input_types";
import { FeatureBridge } from "../communication/feature_bridge";
import { LayoutMode } from "../../types/ui";
import { clamp } from "../../utils/number";
import { sleep } from "../core/scheduling/promise";

export function changeItemSizeOnShiftScroll(wheelEvent: EnhancedWheelEvent): void {
  if (!wheelEvent.originalEvent.shiftKey || LayoutManager.getLayout() === "native") {
    return;
  }
  const usingRowLayout = LayoutManager.getLayout() === "row";
  const id = usingRowLayout ? "row-size" : "column-count";
  const input = document.getElementById(id);

  if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) {
    return;
  }
  const inGallery = FeatureBridge.inGallery.query();

  if (inGallery) {
    return;
  }
  let delta = (wheelEvent.isForward ? 1 : -1);

  if (usingRowLayout) {
    delta = -delta;
  }
  let value = parseInt(input.value) + delta;

  if (input instanceof HTMLSelectElement) {
    const smallestOption = parseInt(input.querySelector("option")?.value ?? "1");
    const largestOption = parseInt((input.querySelector("option:last-child") as HTMLOptionElement)?.value ?? "1");

    value = clamp(value, smallestOption, largestOption);
  }

  input.value = String(value);
  input.dispatchEvent(new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true
  }));
  input.dispatchEvent(new Event("change", {
    bubbles: true
  }));
}

export async function hideUnusedLayoutSizer(layout: LayoutMode): Promise<void> {
  await sleep(10);
  const rowSizeContainer = document.querySelector("#row-size-container, #search-page-row-size");
  const columnCountContainer = document.querySelector("#column-count-container, #search-page-column-count");

  if (!(columnCountContainer instanceof HTMLElement) || !(rowSizeContainer instanceof HTMLElement)) {
    return;
  }

  if (layout === "native") {
    columnCountContainer.style.display = "none";
    rowSizeContainer.style.display = "none";
    return;
  }
  const usingRowLayout = layout === "row";

  columnCountContainer.style.display = usingRowLayout ? "none" : "";
  rowSizeContainer.style.display = usingRowLayout ? "" : "none";
}
