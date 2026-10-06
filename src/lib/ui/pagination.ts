import { PaginationSequence } from "@/types/ui";
import { getNumbersAround } from "@/core/utils/number/number";

export function paginationSequence(currentPage: number, finalPage: number, nearbyCount: number): PaginationSequence {
  const nearbyPages = getNumbersAround(currentPage, nearbyCount, { min: 1, max: finalPage });
  const smallestNearby = nearbyPages[0] ?? 1;
  const largestNearby = nearbyPages[nearbyPages.length - 1] ?? 1;
  const isFirstNearby = smallestNearby === 1;
  const isFinalNearby = largestNearby === finalPage;
  const hasGapAfterFirst = smallestNearby > 2;
  const hasGapBeforeFinal = largestNearby < finalPage - 1;
  return [
    ...(isFirstNearby ? [] : [1]),
    ...(hasGapAfterFirst ? ["ellipsis" as const] : []),
    ...nearbyPages,
    ...(hasGapBeforeFinal ? ["ellipsis" as const] : []),
    ...(isFinalNearby ? [] : [finalPage])
  ];
}
