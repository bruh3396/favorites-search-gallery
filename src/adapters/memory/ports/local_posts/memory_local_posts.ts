import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { Post } from "@/core/domain/post/post";

export class MemoryLocalPosts implements LocalPosts {
  private readonly posts = new Map<string, Post>();

  public getMany(postIds: readonly string[]): Promise<readonly Readonly<Post>[]> {
    return Promise.resolve(postIds.flatMap(id => {
      const post = this.posts.get(id);
      return post === undefined ? [] : [structuredClone(post)];
    }));
  }

  public setMany(posts: readonly Readonly<Post>[]): Promise<void> {
    for (const post of posts) {
      this.posts.set(post.id, structuredClone(post));
    }
    return Promise.resolve();
  }

  public setManyIfAbsent(posts: readonly Readonly<Post>[]): Promise<void> {
    return this.setMany(posts.filter(post => !this.posts.has(post.id)));
  }
}
