import { getNumbersAround } from "@/core/utils/number/number";

export type PageTerm = number | "gap";

export interface PageSequenceOptions {
  pageNumber: number;
  pageCount: number;
  nearbyCount: number;
}

export function getPageSequence({ pageNumber, pageCount, nearbyCount }: PageSequenceOptions): readonly PageTerm[] {
  const nearbyPages = getNumbersAround(pageNumber, nearbyCount, { min: 1, max: pageCount });
  const smallestNearby = nearbyPages[0] ?? 1;
  const largestNearby = nearbyPages[nearbyPages.length - 1] ?? 1;
  const leading: PageTerm[] = smallestNearby > 3 ? [1, "gap"] : listPages(1, smallestNearby - 1);
  const trailing: PageTerm[] = largestNearby < pageCount - 2 ? ["gap", pageCount] : listPages(largestNearby + 1, pageCount);
  return [...leading, ...nearbyPages, ...trailing];
}

function listPages(first: number, last: number): number[] {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) => first + offset);
}
