import { ANONYMOUS, API_ORIGIN, ApiIdentity, Route, sendRequest } from "@/adapters/api/client/server";
import { PostResponse, createPostRequests } from "@/adapters/api/client/post/post";
import { TagResponse, createTagRequests } from "@/adapters/api/client/tag/tag";
import { BatchedRequests } from "@/adapters/api/client/batch";

// The one connection to our API server: its origin, who is asking, and each route's batching.
export class ApiClient {
  private identity: ApiIdentity = ANONYMOUS;
  private readonly posts: BatchedRequests<PostResponse>;
  private readonly tags: BatchedRequests<TagResponse>;

  constructor(private readonly origin: string = API_ORIGIN) {
    this.posts = createPostRequests((route, body) => this.request(route, body));
    this.tags = createTagRequests((route, body) => this.request(route, body));
  }

  public identifyAs(identity: ApiIdentity): void {
    this.identity = identity;
  }

  public ping(): void {
    sendRequest(this.origin, this.identity, "ping");
  }

  public fetchPost(id: string): Promise<PostResponse> {
    return this.posts.schedule(id);
  }

  public fetchTag(tagName: string): Promise<TagResponse> {
    return this.tags.schedule(tagName);
  }

  private async request<Answer>(route: Route, body: Record<string, unknown>): Promise<Record<string, Answer>> {
    const response = await sendRequest(this.origin, this.identity, route, body);
    return await response.json() as Record<string, Answer>;
  }
}
