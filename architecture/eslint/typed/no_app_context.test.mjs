import { runTyped } from "#architecture/eslint/testing/typed_tester.mjs";

const IMPORTS = "import type { AppContext } from \"@/app/context/context\"; import type { Events } from \"@/app/context/events\"; import type { FeatureBridge } from \"@/app/context/feature_bridge\";";

runTyped("no-app-context", {
  valid: [
    `${IMPORTS} interface SnippetContext { favoriteIds: string[] } declare const context: SnippetContext; export const ids = context.favoriteIds;`,
    `${IMPORTS} declare const added: string[]; export const count = added.length;`,
    "interface AppContext { id: number } declare const context: AppContext; export const id = context.id;"
  ],
  invalid: [
    [`${IMPORTS} export function start(context: AppContext): void {}`, 1],
    [`${IMPORTS} declare const host: { context: AppContext }; export const events = host.context.events;`, 4],
    [`${IMPORTS} declare const events: Events; export const added = events.favoriteAdded;`, 2],
    [`${IMPORTS} declare const bridge: FeatureBridge; export const value = bridge.request();`, 2],
    [`${IMPORTS} declare function contextOf(): AppContext; export const bridge = contextOf().bridge;`, 2]
  ]
});
