import { getElementsAroundIndex, getWrappedElementsAroundIndex } from "@/utils/collection/array";

let getCandidates: () => HTMLElement[];

export function setup(getNeighborCandidates: () => HTMLElement[]): void {
  getCandidates = getNeighborCandidates;
}

export function getWrappedItemsAround(id: string, limit: number = 50): HTMLElement[] {
  return getItems(id, limit, getWrappedElementsAroundIndex);
}

export function getItemsAround(id: string, limit: number = 50): HTMLElement[] {
  return getItems(id, limit, getElementsAroundIndex);
}

function getItems(
  id: string,
  limit: number,
  getAroundIndex: (candidates: HTMLElement[], index: number, maxItems: number) => HTMLElement[]
): HTMLElement[] {
  const candidates = getCandidates();
  const index = candidates.findIndex(candidate => candidate.id === id);
  return getAroundIndex(candidates, index, limit);
}
