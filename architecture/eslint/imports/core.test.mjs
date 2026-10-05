import { runRule } from "#architecture/eslint/testing/rule_tester.mjs";

runRule("rule1", {
  valid: [
    ["core/boundary/environment.ts", "core/domain/post"],
    ["adapters/rule34/ports/remote_posts/remote_posts.ts", "core/boundary/environment"],
    ["targets/target.ts", "adapters/rule34/client/client"],
    ["lib/lib.ts", "core/domain/post"],
    ["app/app.ts", "lib/lib"]
  ],
  invalid: [
    ["core/boundary/environment.ts", "lib/lib"],
    ["targets/target.ts", "app/app"],
    ["core/boundary/environment.ts", "features/favorites/types/types"],
    ["core/features/tooltip/tooltip.ts", "lib/lib"]
  ]
});

runRule("rule2", {
  valid: [
    ["core/domain/post.ts", "core/domain/tag"],
    ["core/domain/post.ts", "core/utils/utils"]
  ],
  invalid: [
    ["core/domain/post.ts", "core/boundary/environment"],
    ["core/domain/post.ts", "adapters/rule34/client/client"],
    ["core/domain/post.ts", "targets/target"],
    ["core/domain/post.ts", "core/boundary/ports/scheduler/scheduler"]
  ]
});

runRule("rule3", {
  valid: [
    ["core/boundary/ports/navigator/navigator.ts", "core/domain/post"],
    ["core/boundary/ports/navigator/navigator.ts", "core/boundary/environment"],
    ["core/boundary/ports/navigator/navigator.ts", "core/boundary/ports/scheduler/scheduler"],
    ["core/boundary/ports/remote_posts/fallback_remote_posts.ts", "core/utils/utils"]
  ],
  invalid: [
    ["core/boundary/ports/navigator/navigator.ts", "core/context/context"],
    ["core/boundary/ports/remote_posts/fallback_remote_posts.ts", "lib/lib"],
    ["core/boundary/ports/navigator/navigator.ts", "adapters/rule34/client/client"]
  ]
});

runRule("rule7", {
  valid: [
    ["core/boundary/environment.ts", "core/domain/post"],
    ["targets/target.ts", "adapters/rule34/client/client"]
  ],
  invalid: [
    ["core/boundary/environment.ts", "adapters/rule34/client/client"],
    ["core/boundary/environment.ts", "adapters/memory/ports/local_posts/local_posts"],
    ["core/boundary/environment.ts", "targets/target"],
    ["core/features/tooltip/tooltip.ts", "targets/target"],
    ["core/features/tooltip/tooltip.ts", "adapters/rule34/client/client"]
  ]
});

runRule("rule105", {
  valid: [
    ["core/utils/utils.ts", "core/boundary/environment"],
    ["core/utils/utils.ts", "core/boundary/ports/scheduler/scheduler"]
  ],
  invalid: [
    ["core/utils/utils.ts", "core/domain/post"],
    ["core/utils/utils.ts", "core/context/context"],
    ["core/utils/utils.ts", "core/search/search"],
    ["core/utils/utils.ts", "adapters/memory/ports/local_posts/local_posts"],
    ["core/utils/utils.ts", "targets/target"],
    ["core/utils/utils.test.ts", "adapters/rule34/client/client"]
  ]
});

runRule("rule109", {
  valid: [
    ["core/search/search.ts", "core/domain/post"],
    ["core/search/search.ts", "core/utils/utils"]
  ],
  invalid: [
    ["core/search/search.ts", "core/boundary/environment"],
    ["core/search/search.ts", "core/context/context"],
    ["core/search/search.ts", "lib/lib"]
  ]
});

runRule("rule106", {
  valid: [
    ["core/context/context.ts", "core/domain/post"],
    ["core/context/context.ts", "core/boundary/environment"]
  ],
  invalid: [
    ["core/context/context.ts", "core/utils/utils"],
    ["core/context/context.ts", "adapters/rule34/client/client"]
  ]
});
