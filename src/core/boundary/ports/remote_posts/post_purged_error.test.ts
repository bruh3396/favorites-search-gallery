import { describe, expect, test } from "vitest";
import { PostPurgedError } from "@/core/boundary/ports/remote_posts/post_purged_error";

describe("PostPurgedError", () => {
  test("names the post the site no longer has", () => {
    const postPurgedError = new PostPurgedError("123");

    expect(postPurgedError).toBeInstanceOf(Error);
    expect(postPurgedError.name).toBe("PostPurgedError");
    expect(postPurgedError.postId).toBe("123");
    expect(postPurgedError.message).toBe("Post 123 was purged from the site");
  });
});
