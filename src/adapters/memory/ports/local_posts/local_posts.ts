import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { Post } from "@/core/domain/post/post";

export class MemoryLocalPosts implements LocalPosts {
  private readonly posts = new Map<string, Post>();

  public getMany(ids: string[]): Promise<Post[]> {
    return Promise.resolve(ids.flatMap(id => {
      const post = this.posts.get(id);
      return post === undefined ? [] : [structuredClone(post)];
    }));
  }

  public setMany(posts: Post[]): Promise<void> {
    for (const post of posts) {
      this.posts.set(post.id, structuredClone(post));
    }
    return Promise.resolve();
  }

  public setManyIfAbsent(posts: Post[]): Promise<void> {
    return this.setMany(posts.filter(post => !this.posts.has(post.id)));
  }
}
