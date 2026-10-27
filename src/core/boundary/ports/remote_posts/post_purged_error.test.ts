import { describe, expect, test } from "vitest";
import { PostPurgedError } from "@/core/boundary/ports/remote_posts/post_purged_error";

describe("PostPurgedError", () => {
  test("names the post the site no longer has", () => {
    const error = new PostPurgedError("123");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PostPurgedError");
    expect(error.id).toBe("123");
    expect(error.message).toBe("Post 123 was purged from the site");
  });
});
