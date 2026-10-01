import { runRule } from "#architecture/eslint/testing/rule_tester.mjs";

runRule("rule13", {
  valid: [
    ["testing/post.ts", "lib/testing/tags"],
    ["lib/testing/tags.ts", "testing/post"]
  ],
  invalid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "testing/post"],
    ["core/utils/utils.ts", "testing/post"],
    ["lib/lib.ts", "lib/testing/tags"],
    ["targets/target.ts", "testing/post"]
  ]
});

runRule("tests may import memory adapters and testing", {
  valid: [
    ["testing/post.ts", "adapters/memory/ports/local_posts/local_posts"],
    ["adapters/rule34/ports/remote_posts/remote_posts.test.ts", "testing/post"],
    ["core/domain/post.test.ts", "testing/post"],
    ["core/utils/utils.test.ts", "adapters/memory/ports/local_posts/local_posts"],
    ["core/domain/post.test.ts", "adapters/memory/ports/local_posts/local_posts"],
    ["adapters/rule34/ports/remote_posts/remote_posts.test.ts", "adapters/memory/ports/local_posts/local_posts"]
  ]
});
