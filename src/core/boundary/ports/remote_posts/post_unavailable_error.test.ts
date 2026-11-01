import { describe, expect, test } from "vitest";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";

describe("PostUnavailableError", () => {
  test("names the post it could not fetch", () => {
    const postUnavailableError = new PostUnavailableError("123");

    expect(postUnavailableError).toBeInstanceOf(Error);
    expect(postUnavailableError.name).toBe("PostUnavailableError");
    expect(postUnavailableError.postId).toBe("123");
    expect(postUnavailableError.message).toBe("Post 123 is unavailable from this source");
  });
});
