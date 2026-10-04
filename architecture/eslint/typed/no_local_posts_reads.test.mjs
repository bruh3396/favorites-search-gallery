import { runTyped } from "#architecture/eslint/testing/typed_tester.mjs";

const IMPORTS = "import type { LocalPosts } from \"@/core/boundary/ports/local_posts/local_posts\";";

runTyped("no-local-posts-reads", {
  valid: [
    `${IMPORTS} declare const ports: { localPosts: LocalPosts }; export const port = ports.localPosts;`,
    `${IMPORTS} declare const ports: { localPosts: LocalPosts }; export const { localPosts } = ports;`,
    `${IMPORTS} declare function createLibrary(localPosts: LocalPosts): void; declare const localPosts: LocalPosts; createLibrary(localPosts);`
  ],
  invalid: [
    [`${IMPORTS} declare const ports: { localPosts: LocalPosts }; export const posts = ports.localPosts.getMany([]);`, 1],
    [`${IMPORTS} declare const localPosts: LocalPosts; export const read = localPosts.getMany;`, 1],
    [`${IMPORTS} declare const localPosts: LocalPosts; export const { getMany } = localPosts; export const posts = localPosts["getMany"]([]);`, 1]
  ]
});
