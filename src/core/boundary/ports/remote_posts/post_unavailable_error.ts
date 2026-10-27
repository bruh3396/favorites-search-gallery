export class PostUnavailableError extends Error {
  constructor(public readonly id: string) {
    super(`Post ${id} is unavailable from this source`);
    this.name = "PostUnavailableError";
  }
}
