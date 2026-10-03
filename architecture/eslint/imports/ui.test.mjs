import { runRule } from "#architecture/eslint/testing/rule_tester.mjs";

const SWITCH = "core/ui/components/switch/switch";

runRule("rule4", {
  valid: [
    [`${SWITCH}.ts`, "core/domain/post"],
    [`${SWITCH}.ts`, "core/utils/utils"],
    [`${SWITCH}.test.ts`, SWITCH],
    ["core/ui/control.ts", "core/utils/utils"]
  ],
  invalid: [
    [`${SWITCH}.ts`, "core/boundary/environment"],
    [`${SWITCH}.ts`, "core/context/context"],
    [`${SWITCH}.ts`, "lib/lib"],
    ["core/ui/control.ts", "core/boundary/environment"]
  ]
});

runRule("rule4c", {
  valid: [
    [`${SWITCH}.ts`, "core/ui/control"],
    [`${SWITCH}.ts`, "core/ui/components/switch/thumb"],
    ["core/ui/control.ts", SWITCH]
  ],
  invalid: [
    [`${SWITCH}.ts`, "core/ui/components/segmented/segmented"],
    [`${SWITCH}.ts`, "core/ui/styles.css"],
    [`${SWITCH}.ts`, "core/ui/reset.css"]
  ]
});

runRule("rule4b", {
  valid: [
    ["features/favorites/view/renderer.ts", SWITCH],
    ["features/favorites/control/control.ts", SWITCH],
    ["features/favorites/shell/shell.ts", SWITCH],
    ["features/favorites/control/control.ts", "core/ui/control"],
    ["core/features/tooltip/view/view.ts", SWITCH],
    ["targets/target.ts", "core/ui/styles.css"],
    ["targets/kit/main.ts", SWITCH],
    ["targets/kit/stories/switch.ts", SWITCH],
    ["targets/kit/main.ts", "core/ui/reset.css"]
  ],
  invalid: [
    ["features/favorites/model/model.ts", SWITCH],
    ["features/favorites/flows/search.ts", SWITCH],
    ["features/favorites/types/types.ts", SWITCH],
    ["features/favorites/favorites.ts", SWITCH],
    ["core/features/tooltip/tooltip.ts", SWITCH],
    ["core/domain/post.ts", SWITCH],
    ["core/utils/utils.ts", SWITCH],
    ["core/context/context.ts", SWITCH],
    ["lib/lib.ts", SWITCH],
    ["lib/ui/toggle.ts", SWITCH],
    ["utils/browser/dom.ts", SWITCH],
    ["app/app.ts", SWITCH],
    ["targets/target.ts", SWITCH],
    ["targets/target.ts", "core/ui/reset.css"],
    ["targets/userscript/main.ts", SWITCH]
  ]
});
