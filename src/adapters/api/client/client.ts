import { PostResponse } from "@/adapters/api/client/post/post";
import { RateLimitedResolver } from "@/adapters/api/client/rate_limited_resolver";
import { TagResponse } from "@/adapters/api/client/tag/tag";

export interface ApiIdentity {
  userId: string;
  version: string;
  platform: string;
}

type Route = "ping" | "post" | "tag";

export const API_ORIGIN = "https://frozencobalt.stream";
const POST_RATE_LIMIT = { concurrency: 4, ratePerSecond: 2 };
const TAG_RATE_LIMIT = { concurrency: 4, ratePerSecond: 10 };

export class ApiClient {
  private readonly posts: RateLimitedResolver<PostResponse>;
  private readonly tags: RateLimitedResolver<TagResponse>;
  private readonly headers: Record<string, string>;

  constructor(private readonly origin: string = API_ORIGIN, identity?: ApiIdentity) {
    this.headers = { "X-User-Id": identity?.userId ?? "", "X-Version": identity?.version ?? "", "X-Platform": identity?.platform ?? "" };
    this.posts = new RateLimitedResolver(POST_RATE_LIMIT, ids => this.fetchBatch("post", { ids }));
    this.tags = new RateLimitedResolver(TAG_RATE_LIMIT, tagNames => this.fetchBatch("tag", { tagNames }));
  }

  public ping(): void {
    this.sendRequest("ping");
  }

  public fetchPost(id: string): Promise<PostResponse> {
    return this.posts.schedule(id);
  }

  public fetchTag(tagName: string): Promise<TagResponse> {
    return this.tags.schedule(tagName);
  }

  private async fetchBatch<Answer>(route: Route, body: Record<string, unknown>): Promise<Map<string, Answer>> {
    const response = await this.sendRequest(route, body);
    return new Map(Object.entries(await response.json() as Record<string, Answer>));
  }

  private sendRequest(route: Route, body: Record<string, unknown> = {}): Promise<Response> {
    return fetch(`${this.origin}/${route}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body)
    });
  }
}
