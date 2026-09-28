import { EncodedTagCategory } from "@/types/search";

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited" };
