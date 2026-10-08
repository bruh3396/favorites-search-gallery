import { describe, expect, test, vi } from "vitest";
import { Post } from "@/types/api";
import { resolveAll } from "@/lib/domain/post/resolver";

vi.mock("@/lib/domain/post/store", () => ({ readMany: vi.fn(() => Promise.resolve([])), write: vi.fn() }));
vi.mock("@/lib/remote/fetchers/api", () => ({
  fetchPost: vi.fn(),
  fetchDeletedPost: vi.fn((id: string) => Promise.resolve({
    post: { id, tags: "a b", width: 10, height: 20, score: 0, rating: "e", change: 0, deleted: true, fileURL: "", previewURL: "" },
    tagCategories: new Map()
  }))
}));

function createPost(overrides: Partial<Post>): Post {
  return { id: "1", tags: "a", width: 10, height: 20, score: 0, rating: "e", change: 0, fileURL: "", previewURL: "0123_abc", ...overrides };
}

describe("resolveAll", () => {
  test("keeps the stored preview when the fetched post has none", async() => {
    const resolved: Post[] = [];

    await resolveAll([createPost({ deleted: true })], ({ post }) => resolved.push(post));

    expect(resolved[0].previewURL).toBe("0123_abc");
    expect(resolved[0].tags).toBe("a b");
  });
});
