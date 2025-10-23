import { FavoritesWheelEvent } from "../../../../types/input_types";
import { Layout } from "../../../../types/common_types";
import { clamp } from "../../../../utils/primitive/number";
import { getCurrentLayout } from "./tiler";
import { isInGallery } from "../../../../utils/cross_feature/gallery";
import { sleep } from "../../../../utils/misc/async";

export async function changeItemSizeOnShiftScroll(wheelEvent: FavoritesWheelEvent): Promise<void> {
  if (!wheelEvent.originalEvent.shiftKey || getCurrentLayout() === "native") {
    return;
  }
  const usingRowLayout = getCurrentLayout() === "row";
  const id = usingRowLayout ? "row-size" : "column-count";
  const input = document.getElementById(id);

  if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) {
    return;
  }
  const inGallery = await isInGallery();

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

export async function hideUnusedLayoutSizer(layout: Layout): Promise<void> {
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
