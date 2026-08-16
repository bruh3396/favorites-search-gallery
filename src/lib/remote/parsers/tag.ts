import { EncodedTagCategory, TagCategory } from "@/types/search";
import { PostFetchError } from "@/types/errors";
import { TagResponse } from "@/types/api";

const tagCategoryDecodings: Record<number, TagCategory> = {
  0: "general",
  1: "artist",
  2: "unknown",
  3: "copyright",
  4: "character",
  5: "metadata"
};

const tagCategoryEncodings: Record<string, EncodedTagCategory> = {
  tag: 0,
  artist: 1,
  copyright: 3,
  character: 4,
  metadata: 5
};

export function tagResponseToTagCategory(response: TagResponse): EncodedTagCategory {
  if (response.status === "rate_limited") {
    throw new PostFetchError();
  }
  return response.category;
}

export function decodeTagCategory(encoded: EncodedTagCategory): TagCategory {
  if (encoded === null) {
    return "general";
  }
  return tagCategoryDecodings[encoded] ?? "general";
}

export function encodeTagCategory(type: string): EncodedTagCategory {
  return tagCategoryEncodings[type] ?? null;
}
