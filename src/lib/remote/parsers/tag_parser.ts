import { EncodedTagCategory } from "@/types/search";
import { PostFetchError } from "@/types/errors";
import { TagResponse } from "@/types/api";

export function tagResponseToTagCategory(response: TagResponse): EncodedTagCategory {
  if (response.status === "rate_limited") {
    throw new PostFetchError();
  }
  return response.category;
}
