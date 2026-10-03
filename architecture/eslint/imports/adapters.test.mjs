import { runRule } from "#architecture/eslint/testing/rule_tester.mjs";

runRule("rule8", {
  valid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/rule34/client/client"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/domain/post"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/environment"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/ports/remote_posts"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/utils/utils"]
  ],
  invalid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/memory/ports/local_posts/local_posts"],
    ["adapters/memory/ports/local_posts/local_posts.ts", "adapters/rule34/client/client"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "targets/target"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "app/app"]
  ]
});

runRule("rule9", {
  valid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/rule34/client/client"],
    ["adapters/rule34/environment/environment.ts", "adapters/rule34/client/client"],
    ["adapters/rule34/client/client.ts", "core/domain/post"]
  ],
  invalid: [
    ["adapters/rule34/client/client.ts", "adapters/rule34/ports/remote_posts/remote_posts"],
    ["adapters/rule34/client/client.ts", "adapters/rule34/environment/environment"]
  ]
});

runRule("rule10", {
  valid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/rule34/ports/remote_posts/remote_posts"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/rule34/client/client"],
    ["adapters/rule34/environment/environment.ts", "adapters/rule34/client/client"]
  ],
  invalid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/rule34/ports/remote_favorites/remote_favorites"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/rule34/environment/environment"],
    ["adapters/rule34/environment/environment.ts", "adapters/rule34/ports/remote_posts/remote_posts"]
  ]
});

runRule("rule11", {
  valid: [
    ["adapters/rule34/client/client.ts", "core/boundary/environment"],
    ["adapters/rule34/client/client.ts", "core/domain/post"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/ports/remote_posts"],
    ["adapters/rule34/client/client.ts", "core/boundary/ports/scheduler"],
    ["adapters/rule34/client/client.ts", "core/boundary/ports/random_source"]
  ],
  invalid: [
    ["adapters/rule34/client/client.ts", "core/boundary/ports/remote_posts"],
    ["adapters/rule34/client/client.ts", "core/boundary/ports/navigator"]
  ]
});

runRule("rule12", {
  valid: [
    ["targets/target.ts", "adapters/rule34/client/client"],
    ["targets/target.ts", "adapters/rule34/ports/remote_posts/remote_posts"],
    ["targets/target.ts", "adapters/rule34/environment/environment"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "adapters/rule34/ports/remote_posts/page_fetcher"]
  ],
  invalid: [
    ["targets/target.ts", "adapters/rule34/client/hosts"],
    ["targets/target.ts", "adapters/rule34/ports/remote_posts/page_fetcher"],
    ["targets/target.ts", "adapters/rule34/environment/reader"],
    ["lib/lib.ts", "adapters/rule34/client/client"],
    ["app/app.ts", "adapters/memory/ports/local_posts/local_posts"],
    ["features/favorites/flows/search.ts", "adapters/rule34/client/client"]
  ]
});

runRule("rule63", {
  valid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/ports/remote_posts"],
    ["adapters/memory/ports/local_posts/local_posts.ts", "core/boundary/ports/local_posts"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/ports/scheduler"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/ports/random_source"]
  ],
  invalid: [
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/ports/local_posts"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/ports/navigator"]
  ]
});
