import { PageTerm } from "@/core/ui/components/paginator/page_term";

export function listPageTerms({ pageNumber, pageCount, slotCount }: { pageNumber: number; pageCount: number; slotCount: number }): readonly PageTerm[] {
  if (pageCount <= slotCount) {
    return listPages(1, pageCount);
  }
  const runLength = slotCount - 2;
  const middleRunLength = slotCount - 4;
  const middleStart = pageNumber - Math.floor((middleRunLength - 1) / 2);
  const middleEnd = middleStart + middleRunLength - 1;

  if (middleStart <= 3) {
    return [...listPages(1, runLength), "gap", pageCount];
  }

  if (middleEnd >= pageCount - 2) {
    return [1, "gap", ...listPages(pageCount - runLength + 1, pageCount)];
  }
  return [1, "gap", ...listPages(middleStart, middleEnd), "gap", pageCount];
}

function listPages(first: number, last: number): number[] {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) => first + offset);
}
