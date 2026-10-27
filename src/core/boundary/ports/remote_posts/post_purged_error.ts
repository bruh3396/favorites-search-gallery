export class PostPurgedError extends Error {
  constructor(public readonly id: string) {
    super(`Post ${id} was purged from the site`);
    this.name = "PostPurgedError";
  }
}
