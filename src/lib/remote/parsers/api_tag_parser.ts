import { EncodedTagCategory, TagResponse } from "../../../types/api";
import { RateLimitedError } from "../../../types/errors";

export function tagResponseToTagCategory(response: TagResponse): EncodedTagCategory {
  if (response.status === "rate_limited") {
    throw new RateLimitedError();
  }
  return response.category;
}
