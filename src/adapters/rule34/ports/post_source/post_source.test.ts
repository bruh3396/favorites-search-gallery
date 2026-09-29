import { describe, expect, test } from "vitest";
import { CategorizedPost } from "@/core/domain/post/post";
import { Rule34PostSource } from "@/adapters/rule34/ports/post_source/post_source";
import { createPost } from "@/testing/post";

describe("Rule34PostSource", () => {
  test("reads a post and its tag categories from the post's page", async() => {
    const page = { post: createPost({ id: "42", deleted: true }), tagCategories: new Map([["alice", "character" as const]]) };
    const source = new Rule34PostSource({ fetchPostPage: (id: string): Promise<CategorizedPost> => Promise.resolve(id === "42" ? page : Promise.reject(new Error(id))) });

    expect(await source.fetch("42")).toBe(page);
  });
});
