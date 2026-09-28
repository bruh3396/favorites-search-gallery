import { Post } from "@/core/domain/post/post";

// Posts held in memory, and which of them are favorites, in order.
export class MemoryClient {
  private readonly postsById: Map<string, Post>;
  private favoriteIds: string[];

  constructor(posts: Post[]) {
    this.postsById = new Map(posts.map(post => [post.id, post]));
    this.favoriteIds = posts.map(post => post.id);
  }

  public readFavorites(): Post[] {
    return this.favoriteIds.map(id => this.postsById.get(id)).filter(post => post !== undefined);
  }

  public removeFavorite(id: string): void {
    this.favoriteIds = this.favoriteIds.filter(favoriteId => favoriteId !== id);
  }

  public readPost(id: string): Post | undefined {
    return this.postsById.get(id);
  }
}
