import { PostListService, createPostListService } from "@/core/features/post_list/post_list_service";
import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryRemotePostList } from "@/adapters/memory/ports/remote_post_list/memory_remote_post_list";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

const UNTAGGED = createPost({ id: "1", media: { kind: "image", locator: "1234/a1b2c3" } });
const OTHER = createPost({ id: "2" });
const GIF: Media = { kind: "gif", locator: "1234/a1b2c3.gif" };

function setup(posts: Post[] = [UNTAGGED, OTHER]): PostListService {
  return createPostListService({
    remotePostList: new MemoryRemotePostList({ pageSize: 2, initialPageIndex: 0 }, { readPosts: () => posts })
  });
}

describe("createPostListService", () => {
  test("shows the initial page", () => {
    expect(setup().page.value.posts).toEqual([UNTAGGED, OTHER]);
  });

  describe("showPage", () => {
    test("shows the page asked for", async() => {
      const postListService = setup([UNTAGGED, OTHER, createPost({ id: "3" })]);

      await postListService.showPage(1);
      expect(postListService.page.value.posts.map(post => post.id)).toEqual(["3"]);
    });
  });

  describe("correctMedia", () => {
    test("replaces a shown post's media in place and reports the corrected post", () => {
      const postListService = setup();
      const changed = vi.fn();

      postListService.changed.on(changed);
      postListService.correctMedia("1", GIF);
      expect(postListService.page.value.posts).toEqual([{ ...UNTAGGED, media: GIF }, OTHER]);
      expect(changed).toHaveBeenCalledExactlyOnceWith({ ...UNTAGGED, media: GIF });
    });

    test("ignores a post no longer shown", () => {
      const postListService = setup();
      const changed = vi.fn();
      const postListPage = postListService.page.value;

      postListService.changed.on(changed);
      postListService.correctMedia("9", GIF);
      expect(postListService.page.value).toBe(postListPage);
      expect(changed).not.toHaveBeenCalled();
    });
  });
});
