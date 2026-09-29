import * as PostStore from "@/lib/domain/post/store";
import { CategorizedPost, Post } from "@/core/domain/post/post";
import { PostSource } from "@/core/boundary/ports/post_source";

export interface PostResolverDependencies {
  readStored: (ids: string[]) => Promise<Post[]>;
  store: (post: Post) => void;
}

export class PostResolver {
  constructor(
    private readonly source: PostSource,
    private readonly dependencies: PostResolverDependencies = { readStored: PostStore.readMany, store: PostStore.write }
  ) { }

  public async resolveAll(stalePosts: Post[], onResolved: (resolved: CategorizedPost) => void): Promise<void> {
    const staleById = new Map(stalePosts.map(post => [post.id, post]));
    const stored = await this.dependencies.readStored([...staleById.keys()]);

    for (const post of stored) {
      staleById.delete(post.id);
      onResolved({ post, tagCategories: new Map() });
    }
    await Promise.all([...staleById.values()].map(stale => this.source.fetch(stale.id).then(
      fetched => onResolved(this.refresh(stale, fetched)),
      () => { }
    )));
  }

  private refresh(stale: Post, { post, tagCategories }: CategorizedPost): CategorizedPost {
    const fresh = { ...stale, ...post, fetchedAt: Date.now() };

    this.dependencies.store(fresh);
    return { post: fresh, tagCategories };
  }
}
