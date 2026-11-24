export interface SearchBoxTextSpan {
  readonly start: number;
  readonly end: number;
  readonly tone: number;
  readonly matchedStart?: number;
}
