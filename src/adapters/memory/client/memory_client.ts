import { Post } from "@/core/domain/post/post";

export class MemoryClient {
  private readonly postsById: Map<string, Post>;
  private favoritePostIds: string[];

  constructor(posts: Post[]) {
    this.postsById = new Map(posts.map(post => [post.id, post]));
    this.favoritePostIds = posts.map(post => post.id);
  }

  public readPosts(): Post[] {
    return [...this.postsById.values()];
  }

  public readFavorites(): Post[] {
    return this.favoritePostIds.map(id => this.postsById.get(id)).filter(post => post !== undefined);
  }

  public addFavorite(postId: string): void {
    if (this.postsById.has(postId) && !this.favoritePostIds.includes(postId)) {
      this.favoritePostIds = [postId, ...this.favoritePostIds];
    }
  }

  public removeFavorite(postId: string): void {
    this.favoritePostIds = this.favoritePostIds.filter(favoriteId => favoriteId !== postId);
  }

  public readPost(postId: string): Post | undefined {
    return this.postsById.get(postId);
  }
}
