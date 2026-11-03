import { describe, expect, test } from "vitest";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";
import { UnavailableRemotePosts } from "@/core/boundary/ports/remote_posts/unavailable_remote_posts";

describe("UnavailableRemotePosts", () => {
  describe("fetch", () => {
    test("rejects every fetch with PostUnavailableError", async() => {
      await expect(new UnavailableRemotePosts().fetch({ id: "7", status: "active" })).rejects.toEqual(new PostUnavailableError("7"));
    });
  });
});
