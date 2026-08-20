import { PaginationSequence, PaginationTerm } from "@/types/ui";
import { numbersAround } from "@/utils/pure/number";

type PaginationUpdateStrategy = "skip" | "patch" | "rebuild";

export function paginationSequence(currentPage: number, finalPage: number, nearbyCount: number): PaginationSequence {
  const nearbyPages = numbersAround(currentPage, nearbyCount, 1, finalPage);
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

export function paginationUpdateStrategy(previous: PaginationSequence, next: PaginationSequence): PaginationUpdateStrategy {
  return sequencesEqual(previous, next) ? "skip" : sequenceShapesEqual(previous, next) ? "patch" : "rebuild";
}

function sequencesEqual(a: PaginationSequence, b: PaginationSequence): boolean {
  return a.length === b.length && a.every((term, index) => term === b[index]);
}

function sequenceShapesEqual(a: PaginationSequence, b: PaginationSequence): boolean {
  return a.length === b.length && a.every((term, index) => isEllipsis(term) === isEllipsis(b[index]));
}

function isEllipsis(term: PaginationTerm | undefined): boolean {
  return term === "ellipsis";
}
