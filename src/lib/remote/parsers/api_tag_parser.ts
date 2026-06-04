import { EncodedTagCategory, TagResponse } from "@/types/api";
import { RateLimitedError } from "@/types/errors";
import { TagCategory } from "@/types/search";

const tagCategoryDecodings: Record<number, TagCategory> = {
  0: "general",
  1: "artist",
  2: "unknown",
  3: "copyright",
  4: "character",
  5: "metadata"
};

export function tagResponseToTagCategory(response: TagResponse): EncodedTagCategory {
  if (response.status === "rate_limited") {
    throw new RateLimitedError();
  }
  return response.category;
}

export function decodeTagCategory(encoded: EncodedTagCategory): TagCategory {
  if (encoded === null) {
    return "general";
  }
  return tagCategoryDecodings[encoded] ?? "general";
}
