export type EncodedTagCategory = 0 | 1 | 2 | 3 | 4 | 5 | null;
export type EncodedTagCategoryMap = Record<string, EncodedTagCategory>;

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited" };
