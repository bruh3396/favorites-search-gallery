import { toggleDataset } from "@/utils/browser/dataset";

export function setInfiniteScrollStyle(value: boolean): void {
  toggleDataset(document.body, "infiniteScroll", value);
}
