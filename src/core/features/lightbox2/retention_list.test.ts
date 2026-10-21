import { describe, expect, test } from "vitest";
import { LightboxRetentionList } from "@/core/features/lightbox2/retention_list";
import { Post } from "@/core/domain/post/post";
import { createPosts } from "@/testing/post";

const POSTS = createPosts("1", "2", "3", "4");

describe("LightboxRetentionList", () => {
  test("starts empty", () => {
    expect(new LightboxRetentionList<Post>({ capacity: 2 }).items.value).toEqual([]);
  });

  describe("retain", () => {
    test("puts the newest items first, without repeats, up to its capacity", () => {
      const list = new LightboxRetentionList<Post>({ capacity: 3 });

      list.retain([POSTS[0], POSTS[1]]);
      list.retain([POSTS[2], POSTS[0]]);
      expect(list.items.value).toEqual([POSTS[2], POSTS[0], POSTS[1]]);
      list.retain([POSTS[3]]);
      expect(list.items.value).toEqual([POSTS[3], POSTS[2], POSTS[0]]);
    });

    test("publishes nothing new when the items don't change", () => {
      const list = new LightboxRetentionList<Post>({ capacity: 2 });

      list.retain([POSTS[0], POSTS[1]]);
      const published = list.items.value;

      list.retain([POSTS[0]]);
      expect(list.items.value).toBe(published);
    });
  });
});
