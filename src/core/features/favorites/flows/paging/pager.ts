import { Direction } from "@/core/contracts/listing";
import { clamp } from "@/core/utils/number/number";

const SCROLL_BATCH_SIZE = 25;
const STEPS: Record<Direction, number> = { forward: 1, backward: -1 };

export interface StepOptions {
  pageCount: number;
  canWrap: boolean;
}

export interface Pager {
  readonly pageSize: number;
  slice: <T>(items: readonly T[], pageNumber: number) => readonly T[];
  step: (from: number, direction: Direction, options: StepOptions) => number | undefined;
}

export function countPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function clampPage(pageNumber: number, pageCount: number): number {
  return clamp(pageNumber, 1, pageCount);
}

function wrapPage(pageNumber: number, pageCount: number): number {
  return ((((pageNumber - 1) % pageCount) + pageCount) % pageCount) + 1;
}

function keepIfInRange(pageNumber: number, pageCount: number): number | undefined {
  return pageNumber === clampPage(pageNumber, pageCount) ? pageNumber : undefined;
}

export function createNumberedPager(pageSize: number): Pager {
  return {
    pageSize,
    slice: <T>(items: readonly T[], pageNumber: number): readonly T[] => items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
    step: (from: number, direction: Direction, { pageCount, canWrap }: StepOptions): number | undefined => {
      const to = from + STEPS[direction];
      return canWrap ? wrapPage(to, pageCount) : keepIfInRange(to, pageCount);
    }
  };
}

export const SCROLLING_PAGER: Pager = {
  pageSize: SCROLL_BATCH_SIZE,
  slice: <T>(items: readonly T[], pageNumber: number): readonly T[] => items.slice(0, pageNumber * SCROLL_BATCH_SIZE),
  step: (from: number, direction: Direction, { pageCount }: StepOptions): number | undefined => {
    return direction === "forward" ? keepIfInRange(from + 1, pageCount) : undefined;
  }
};
