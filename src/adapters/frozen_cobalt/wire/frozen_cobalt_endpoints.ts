export interface FrozenCobaltEndpoints {
  readonly ping: Record<string, never>;
  readonly posts: { ids: string[] };
  readonly tags: { tagNames: string[] };
}
