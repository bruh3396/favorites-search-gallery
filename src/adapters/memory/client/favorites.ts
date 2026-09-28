import { Post } from "@/core/domain/post/post";

export class MemoryFavorites {
  private posts: Post[];

  constructor(posts: Post[]) {
    this.posts = [...posts];
  }

  public all(): Post[] {
    return [...this.posts];
  }

  public remove(id: string): void {
    this.posts = this.posts.filter(post => post.id !== id);
  }
}
