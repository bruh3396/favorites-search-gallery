export type PaginationTerm = number | "ellipsis";
export type PaginationSequence = PaginationTerm[];

export interface PaginationState {
  totalCount: number;
  sliceStart: number;
  sliceEnd: number;
  currentPage: number;
  finalPage: number;
  sequence: PaginationSequence;
}

export interface ContentDisplayOptions {
  fade: boolean;
}
