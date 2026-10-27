export class PostPurgedError extends Error {
  constructor(public readonly postId: string) {
    super(`Post ${postId} was purged from the site`);
    this.name = "PostPurgedError";
  }
}
