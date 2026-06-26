import { toggleDataset } from "@/utils/dom/dataset";

export function setInfiniteScrollStyle(value: boolean): void {
  toggleDataset(document.body, "infiniteScroll", value);
}
