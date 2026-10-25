import { PostListService, createPostListService } from "@/core/features/post_list/post_list";
import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRemoteSearchResults } from "@/adapters/memory/ports/remote_search_results/remote_search_results";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

const UNTAGGED = createPost({ id: "1", media: { kind: "image", locator: "1234/a1b2c3" } });
const OTHER = createPost({ id: "2" });
const GIF: Media = { kind: "gif", locator: "1234/a1b2c3.gif" };

function setup(posts: Post[] = [UNTAGGED, OTHER]): PostListService {
  return createPostListService({
    remoteSearchResults: new MemoryRemoteSearchResults({ pageSize: 2, initialPageIndex: 0 }, { readPosts: () => posts })
  });
}

describe("createPostListService", () => {
  test("shows the initial page", () => {
    expect(setup().page.value.posts).toEqual([UNTAGGED, OTHER]);
  });

  describe("showPage", () => {
    test("shows the page asked for", async() => {
      const postList = setup([UNTAGGED, OTHER, createPost({ id: "3" })]);

      await postList.showPage(1);
      expect(postList.page.value.posts.map(post => post.id)).toEqual(["3"]);
    });
  });

  describe("correctMedia", () => {
    test("replaces a shown post's media in place and reports the corrected post", () => {
      const postList = setup();
      const changed = vi.fn();

      postList.changed.on(changed);
      postList.correctMedia("1", GIF);
      expect(postList.page.value.posts).toEqual([{ ...UNTAGGED, media: GIF }, OTHER]);
      expect(changed).toHaveBeenCalledExactlyOnceWith({ ...UNTAGGED, media: GIF });
    });

    test("ignores a post no longer shown", () => {
      const postList = setup();
      const changed = vi.fn();
      const page = postList.page.value;

      postList.changed.on(changed);
      postList.correctMedia("9", GIF);
      expect(postList.page.value).toBe(page);
      expect(changed).not.toHaveBeenCalled();
    });
  });
});
