import { describe, expect, test } from "vitest";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";

describe("PostUnavailableError", () => {
  test("names the post it could not fetch", () => {
    const error = new PostUnavailableError("123");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PostUnavailableError");
    expect(error.postId).toBe("123");
    expect(error.message).toBe("Post 123 is unavailable from this source");
  });
});
