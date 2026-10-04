export const MESSAGES = {
  rule88: "rule 88: only FavoritesPostLibrary may import the LocalPosts port"
};

export const POLICIES = [
  {
    from: { element: { type: "!{core/boundary/ports,adapters/ports}" } },
    disallow: [{ to: { element: { type: "core/boundary/ports", fileInternalPath: "local_posts/local_posts.ts" } } }],
    message: MESSAGES.rule88
  },
  {
    from: { file: { path: "**/favorites/model/posts/library.ts" } },
    allow: [{ to: { element: { type: "core/boundary/ports", fileInternalPath: "local_posts/local_posts.ts" } } }]
  }
];
