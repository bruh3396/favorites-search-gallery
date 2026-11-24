export interface ScannedSearchOperator {
  readonly start: number;
  readonly end: number;
  readonly depth: number;
  readonly matchedStart?: number;
}
