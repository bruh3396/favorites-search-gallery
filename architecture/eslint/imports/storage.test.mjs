import { runRule } from "#architecture/eslint/testing/rule_tester.mjs";

runRule("rule88", {
  valid: [
    ["features/favorites/model/posts/library.ts", "core/boundary/ports/local_posts"],
    ["core/boundary/ports/navigation.ts", "core/boundary/ports/local_posts"],
    ["lib/lib.ts", "core/boundary/ports/remote_posts"]
  ],
  invalid: [
    ["lib/lib.ts", "core/boundary/ports/local_posts"],
    ["core/utils/utils.ts", "core/boundary/ports/local_posts"],
    ["core/domain/post.test.ts", "core/boundary/ports/local_posts"]
  ]
});
