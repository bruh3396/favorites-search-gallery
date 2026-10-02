import { runRule } from "#architecture/eslint/testing/rule_tester.mjs";

runRule("rule4", {
  valid: [
    ["core/ui/switch/switch.ts", "core/domain/post"],
    ["core/ui/switch/switch.test.ts", "core/ui/switch/switch"]
  ],
  invalid: [
    ["core/ui/switch/switch.ts", "core/utils/utils"],
    ["core/ui/switch/switch.ts", "core/boundary/environment"],
    ["core/ui/switch/switch.ts", "core/context/context"]
  ]
});

runRule("rule4b", {
  valid: [
    ["features/favorites/view/renderer.ts", "core/ui/switch/switch"],
    ["features/favorites/control/control.ts", "core/ui/switch/switch"],
    ["features/favorites/shell/shell.ts", "core/ui/switch/switch"],
    ["core/features/tooltip/view/view.ts", "core/ui/switch/switch"],
    ["lib/ui/toggle.ts", "core/ui/switch/switch"],
    ["utils/browser/dom.ts", "core/ui/switch/switch"],
    ["targets/target.ts", "core/ui/styles.css"]
  ],
  invalid: [
    ["features/favorites/model/model.ts", "core/ui/switch/switch"],
    ["features/favorites/flows/search.ts", "core/ui/switch/switch"],
    ["features/favorites/types/types.ts", "core/ui/switch/switch"],
    ["features/favorites/favorites.ts", "core/ui/switch/switch"],
    ["core/features/tooltip/tooltip.ts", "core/ui/switch/switch"],
    ["core/domain/post.ts", "core/ui/switch/switch"],
    ["core/utils/utils.ts", "core/ui/switch/switch"],
    ["core/context/context.ts", "core/ui/switch/switch"],
    ["lib/lib.ts", "core/ui/switch/switch"],
    ["app/app.ts", "core/ui/switch/switch"],
    ["targets/target.ts", "core/ui/switch/switch"],
    ["targets/target.ts", "core/ui/reset.css"]
  ]
});
