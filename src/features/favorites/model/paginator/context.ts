import { PaginationContext, PaginationSequence } from "@/features/favorites/types/interfaces";
import { numbersAroundInRange } from "@/utils/number";

export function paginationContext(currentPage: number, pageCount: number, totalCount: number, resultsPerPage: number, nearbyCount: number): PaginationContext {
  return {
    currentPage,
    finalPage: pageCount,
    totalCount,
    sliceStart: resultsPerPage * (currentPage - 1),
    sliceEnd: resultsPerPage * currentPage,
    sequence: paginationSequence(currentPage, pageCount, nearbyCount)
  };
}

export function paginationSequence(currentPage: number, finalPage: number, nearbyCount: number): PaginationSequence {
  const nearbyPages = numbersAroundInRange(currentPage, nearbyCount, 1, finalPage);
  const smallestNearby = nearbyPages[0] ?? 1;
  const largestNearby = nearbyPages[nearbyPages.length - 1] ?? 1;
  const nearbyIncludesFirst = smallestNearby === 1;
  const nearbyIncludesFinal = largestNearby === finalPage;
  const gapAfterFirst = smallestNearby > 2;
  const gapBeforeFinal = largestNearby < finalPage - 1;
  return [
    ...(nearbyIncludesFirst ? [] : [1]),
    ...(gapAfterFirst ? ["ellipsis" as const] : []),
    ...nearbyPages,
    ...(gapBeforeFinal ? ["ellipsis" as const] : []),
    ...(nearbyIncludesFinal ? [] : [finalPage])
  ];
}
