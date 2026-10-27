export interface FrozenCobaltEndpoints {
  readonly ping: Record<string, never>;
  readonly post: { ids: string[] };
  readonly tag: { tagNames: string[] };
}
