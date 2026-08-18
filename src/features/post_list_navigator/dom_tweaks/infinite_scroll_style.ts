import { toggleDataset } from "@/utils/platform/dataset";

export function setInfiniteScrollStyle(value: boolean): void {
  toggleDataset(document.body, "infiniteScroll", value);
}
