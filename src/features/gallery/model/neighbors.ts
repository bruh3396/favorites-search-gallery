import { getElementsAroundIndex, getWrappedElementsAroundIndex } from "@/utils/collection/array";
import { ON_FAVORITES_PAGE } from "@/lib/environment";

let getCandidates: () => HTMLElement[];

export function setup(getNeighborCandidates: () => HTMLElement[]): void {
  getCandidates = getNeighborCandidates;
}

export const getItemsAround = (
  id: string,
  limit: number = 50
): HTMLElement[] => (ON_FAVORITES_PAGE ? getWrappedItemsAround : getUnwrappedItemsAround)(
    id,
    limit
  );

function getWrappedItemsAround(id: string, limit: number): HTMLElement[] {
  return getItems(id, limit, getWrappedElementsAroundIndex);
}

function getUnwrappedItemsAround(id: string, limit: number): HTMLElement[] {
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
