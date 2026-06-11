import { PaginationSequence, PaginationTerm } from "@/types/ui";
import { numbersAroundInRange } from "@/utils/number";

type PaginationUpdateStrategy = "skip" | "patch" | "rebuild";

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
