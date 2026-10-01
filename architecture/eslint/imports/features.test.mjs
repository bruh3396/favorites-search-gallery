import { runRule } from "#architecture/eslint/testing/rule_tester.mjs";

runRule("rule16", {
  valid: [
    ["features/favorites/flows/search.ts", "features/favorites/types/types"],
    ["app/app.ts", "features/gallery/gallery"],
    ["core/features/tooltip/tooltip.ts", "core/domain/post"]
  ],
  invalid: [
    ["features/favorites/flows/search.ts", "features/gallery/types/types"],
    ["features/gallery/gallery.ts", "features/favorites/favorites"],
    ["features/favorites/features/snippets/model/store.ts", "features/gallery/types/types"],
    ["features/favorites/flows/search.ts", "features/gallery/model/model"],
    ["core/features/tooltip/tooltip.ts", "features/favorites/types/types"]
  ]
});

runRule("rule17", {
  valid: [
    ["features/favorites/favorites.ts", "features/favorites/features/snippets/snippets"],
    ["features/favorites/features/features.ts", "features/favorites/features/snippets/types/types"],
    ["features/favorites/features/snippets/model/store.ts", "features/favorites/features/snippets/types/types"],
    ["features/favorites/features/snippets/snippets.ts", "features/favorites/features/snippets/model/store"],
    ["features/favorites/flows/search.ts", "features/favorites/features/snippets/types/types"],
    ["features/favorites/features/snippets/testing/snippets.ts", "features/favorites/features/snippets/types/types"]
  ],
  invalid: [
    ["features/favorites/features/features.ts", "features/favorites/features/snippets/model/store"],
    ["features/favorites/flows/search.ts", "features/favorites/features/snippets/snippets"],
    ["features/favorites/features/snippets/snippets.ts", "features/favorites/features/downloader/downloader"]
  ]
});

runRule("rule18", {
  valid: [
    ["features/favorites/control/control.ts", "features/favorites/shell/shell"],
    ["features/favorites/view/renderer.ts", "features/favorites/shell/shell"],
    ["features/favorites/favorites.ts", "features/favorites/shell/shell"]
  ],
  invalid: [
    ["features/favorites/flows/search.ts", "features/favorites/shell/shell"],
    ["features/favorites/model/model.ts", "features/favorites/shell/shell"],
    ["features/favorites/types/types.ts", "features/favorites/shell/shell"]
  ]
});

runRule("rule18b", {
  valid: [
    ["features/favorites/shell/shell.ts", "features/favorites/types/types"],
    ["features/favorites/shell/shell.ts", "core/domain/post"],
    ["features/favorites/shell/shell.ts", "core/utils/utils"],
    ["features/favorites/shell/shell.ts", "core/boundary/environment"],
    ["features/favorites/shell/shell.ts", "lib/lib"],
    ["features/favorites/shell/shell.ts", "app/context/shell"],
    ["features/favorites/shell/shell.ts", "app/context/environment"]
  ],
  invalid: [
    ["features/favorites/shell/shell.ts", "features/favorites/model/model"],
    ["features/favorites/shell/shell.ts", "features/favorites/view/view"],
    ["features/favorites/shell/shell.ts", "features/favorites/favorites"],
    ["features/favorites/shell/shell.ts", "core/context/context"],
    ["features/favorites/shell/shell.ts", "core/boundary/ports/scheduler"],
    ["features/favorites/shell/shell.ts", "app/context/events"]
  ]
});

runRule("rule19", {
  valid: [
    ["features/favorites/flows/search.ts", "features/favorites/model/model"],
    ["features/favorites/control/control.ts", "features/favorites/view/view"],
    ["features/favorites/favorites.ts", "features/favorites/model/model"],
    ["features/favorites/features/features.ts", "features/favorites/view/view"],
    ["features/favorites/model/posts/library.ts", "features/favorites/model/model"],
    ["features/favorites/model/model.ts", "features/favorites/model/posts/library"],
    ["features/favorites/view/renderer.ts", "features/favorites/view/view"],
    ["features/favorites/favorites.test.ts", "features/favorites/model/model"]
  ],
  invalid: [
    ["features/favorites/flows/search.ts", "features/favorites/model/posts/library"],
    ["features/favorites/view/renderer.ts", "features/favorites/model/model"],
    ["features/favorites/types/types.ts", "features/favorites/model/model"],
    ["app/app.ts", "features/favorites/model/model"],
    ["features/favorites/favorites.test.ts", "features/favorites/view/renderer"]
  ]
});

runRule("rule55", {
  valid: [
    ["features/favorites/features/snippets/model/store.ts", "features/favorites/types/types"],
    ["features/favorites/features/snippets/snippets.ts", "lib/lib"]
  ],
  invalid: [
    ["features/favorites/features/snippets/snippets.ts", "app/context/context"],
    ["features/favorites/features/snippets/model/store.ts", "app/context/events"],
    ["features/favorites/features/snippets/model/store.ts", "app/context/feature_bridge"],
    ["features/favorites/features/snippets/snippets.ts", "core/context/context"]
  ]
});
