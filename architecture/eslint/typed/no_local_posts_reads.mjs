import { createForbiddenTypeRule } from "#architecture/eslint/typed/forbidden_type.mjs";

export const noLocalPostsReads = createForbiddenTypeRule({
  description: "only FavoritesPostLibrary reads LocalPosts",
  messageId: "rule88",
  message: "rule 88: only FavoritesPostLibrary reads LocalPosts; pass the port through to it and ask the library",
  types: [["src/core/boundary/ports/local_posts.ts", "LocalPosts"]],
  selector: "MemberExpression",
  nodeOf: node => node.object
});
