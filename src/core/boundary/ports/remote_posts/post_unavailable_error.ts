export class PostUnavailableError extends Error {
  constructor(public readonly postId: string) {
    super(`Post ${postId} is unavailable from this source`);
    this.name = "PostUnavailableError";
  }
}
