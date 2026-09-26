import { ParsedPost, Post } from "@/types/api";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesMetadataEnricher } from "@/features/favorites/model/enrichment/metadata_enricher";
import { TagCategoryMap } from "@/types/search";
import { TermUpdate } from "@/lib/search/engines/search_engine";
import { createPost } from "@/testing/post";

function createFavorite(id: string, tags: string[]): Favorite {
  const favorite = {
    id,
    post: createPost({ id, tags: tags.join(" ") }),
    tags: new Set(tags),
    enrich: vi.fn((post: Post) => {
      favorite.post = post;
      favorite.tags = new Set([...post.tags.split(" "), id]);
    })
  };
  return favorite as unknown as Favorite;
}

function createParsedPost(post: Post, tagCategories: TagCategoryMap = new Map()): ParsedPost {
  return { post, tagCategories };
}

function createResolver(results: ParsedPost[]): (posts: Post[], onResolved: (resolved: ParsedPost) => void) => Promise<void> {
  return vi.fn((_posts: Post[], onResolved: (resolved: ParsedPost) => void) => {
    results.forEach(onResolved);
    return Promise.resolve();
  });
}

function setup(results: ParsedPost[]): {
  enricher: FavoritesMetadataEnricher;
  enriched: Favorite[];
  tagUpdates: TermUpdate<Favorite>[];
  persisted: TagCategoryMap[];
  resolvePosts: ReturnType<typeof createResolver>;
} {
  const enriched: Favorite[] = [];
  const tagUpdates: TermUpdate<Favorite>[] = [];
  const persisted: TagCategoryMap[] = [];
  const resolvePosts = createResolver(results);
  const enricher = new FavoritesMetadataEnricher(
    favorite => enriched.push(favorite),
    update => tagUpdates.push(update),
    resolvePosts,
    tagCategories => persisted.push(tagCategories)
  );
  return { enricher, enriched, tagUpdates, persisted, resolvePosts };
}

describe("FavoritesMetadataEnricher", () => {
  test("passes each favorite's post to the resolver", async() => {
    const a = createFavorite("1", ["a"]);
    const b = createFavorite("2", ["b"]);
    const { enricher, resolvePosts } = setup([]);

    await enricher.enrich([a, b]);
    expect(resolvePosts).toHaveBeenCalledWith([a.post, b.post], expect.any(Function));
  });

  test("enriches the favorite matching the resolved post and reports it", async() => {
    const favorite = createFavorite("1", ["a", "1"]);
    const latest = createPost({ id: "1", tags: "a" });
    const { enricher, enriched } = setup([createParsedPost(latest)]);

    await enricher.enrich([favorite]);
    expect(favorite.enrich).toHaveBeenCalledWith(latest);
    expect(enriched).toEqual([favorite]);
  });

  test("reports a tag change with the old and new tags when tags differ", async() => {
    const favorite = createFavorite("1", ["a", "1"]);
    const { enricher, tagUpdates } = setup([createParsedPost(createPost({ id: "1", tags: "a b" }))]);

    await enricher.enrich([favorite]);
    expect(tagUpdates).toHaveLength(1);
    expect(tagUpdates[0].doc).toBe(favorite);
    expect(tagUpdates[0].oldTerms).toEqual(new Set(["a", "1"]));
    expect(tagUpdates[0].newTerms).toEqual(new Set(["a", "b", "1"]));
  });

  test("does not report a tag change when tags are identical", async() => {
    const favorite = createFavorite("1", ["a", "b"]);
    const { enricher, tagUpdates, enriched } = setup([createParsedPost(createPost({ id: "1", tags: "a b" }))]);

    await enricher.enrich([favorite]);
    expect(tagUpdates).toHaveLength(0);
    expect(enriched).toEqual([favorite]);
  });

  test("ignores the favorite's own id when comparing tags", async() => {
    const favorite = createFavorite("1", ["a", "b", "1"]);
    const { enricher, tagUpdates } = setup([createParsedPost(createPost({ id: "1", tags: "a b" }))]);

    await enricher.enrich([favorite]);
    expect(tagUpdates).toHaveLength(0);
  });

  test("reports a single-tag difference that is not the id", async() => {
    const favorite = createFavorite("1", ["a", "b"]);
    const { enricher, tagUpdates } = setup([createParsedPost(createPost({ id: "1", tags: "a" }))]);

    await enricher.enrich([favorite]);
    expect(tagUpdates).toHaveLength(1);
  });

  test("snapshots old tags before enriching", async() => {
    const favorite = createFavorite("1", ["a"]);
    const originalTags = favorite.tags;
    const { enricher, tagUpdates } = setup([createParsedPost(createPost({ id: "1", tags: "b" }))]);

    await enricher.enrich([favorite]);
    expect(tagUpdates[0].oldTerms).not.toBe(originalTags);
    expect(tagUpdates[0].oldTerms).toEqual(new Set(["a"]));
  });

  test("persists tag categories for every resolved post", async() => {
    const categories: TagCategoryMap = new Map([["a", "artist"]]) as TagCategoryMap;
    const { enricher, persisted } = setup([createParsedPost(createPost({ id: "1", tags: "a" }), categories)]);

    await enricher.enrich([createFavorite("1", ["a"])]);
    expect(persisted).toEqual([categories]);
  });

  test("persists tag categories but skips enrichment for an unmatched post", async() => {
    const favorite = createFavorite("1", ["a"]);
    const categories: TagCategoryMap = new Map([["x", "general"]]) as TagCategoryMap;
    const { enricher, enriched, tagUpdates, persisted } = setup([createParsedPost(createPost({ id: "999", tags: "x" }), categories)]);

    await enricher.enrich([favorite]);
    expect(persisted).toEqual([categories]);
    expect(favorite.enrich).not.toHaveBeenCalled();
    expect(enriched).toHaveLength(0);
    expect(tagUpdates).toHaveLength(0);
  });

  test("routes each resolved post to its own favorite", async() => {
    const a = createFavorite("1", ["a"]);
    const b = createFavorite("2", ["b"]);
    const { enricher, enriched } = setup([createParsedPost(createPost({ id: "2", tags: "b" })), createParsedPost(createPost({ id: "1", tags: "a" }))]);

    await enricher.enrich([a, b]);
    expect(enriched).toEqual([b, a]);
  });
});
