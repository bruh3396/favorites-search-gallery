import { runSyntax } from "#architecture/eslint/testing/syntax_tester.mjs";

const FEATURE_FILES = ["core/utils/utils.ts", "features/favorites/model/model.ts", "features/favorites/view/renderer.ts", "features/favorites/flows/search.ts", "features/favorites/control/control.ts", "features/favorites/features/features.ts", "features/favorites/features/snippets/model/store.ts", "core/features/tooltip/view/view.ts"];
const ROOTS = ["features/favorites/favorites.ts", "features/favorites/features/snippets/snippets.ts", "core/features/tooltip/tooltip.ts", "core/app/app.ts", "app/app.ts", "targets/target.ts", "adapters/rule34/client/client.ts"];

function casesFor(files, code) {
  return files.map(file => [file, code]);
}

runSyntax("rule41", {
  valid: [
    ...casesFor(ROOTS, "if (context.environment.mode === \"favorites\") { start(); }"),
    ["features/favorites/flows/search.test.ts", "if (context.environment.mode === \"favorites\") { start(); }"],
    ["features/favorites/flows/search.ts", "budget.release();"],
    ["features/favorites/flows/search.ts", "const limit = budget.cachedImageCount;"]
  ],
  invalid: [
    ...casesFor(FEATURE_FILES, "if (context.environment.mode === \"favorites\") { start(); }"),
    ["features/favorites/view/renderer.ts", "const touch = options.pointer !== \"hover\";"],
    ["features/favorites/view/renderer.ts", "const full = \"full\" == settings.canvasBudget;"],
    ["features/favorites/view/renderer.ts", "switch (options.mode) { default: break; }"]
  ]
});

runSyntax("rule42", {
  valid: [
    ["features/favorites/view/renderer.ts", "const touch = pointer === \"touch\";"],
    ["core/boundary/environment.ts", "export type Pointer = \"hover\" | \"touch\";"]
  ],
  invalid: [
    ["core/boundary/environment.ts", "export interface RuntimeEnvironment { device: string; }"],
    ["core/boundary/environment.ts", "export type Device = \"desktop\" | \"mobile\";"],
    ["adapters/rule34/environment/reader.ts", "export function read(): Pick<Environment, \"device\"> { return read(); }"],
    ["targets/target.ts", "const platform = environment.device;"],
    ["features/favorites/favorites.ts", "const icons = ICONS[context.environment.device];"],
    ["testing/post.ts", "const environment = { device: \"mobile\" };"],
    ["features/favorites/flows/search.test.ts", "const environment = { device: \"mobile\" };"]
  ]
});

runSyntax("rule43", {
  valid: [
    ...casesFor(ROOTS, "const budget = BUDGETS[context.environment.canvasBudget];"),
    ["features/favorites/flows/search.test.ts", "const context = createContext({ environment });"],
    ["features/favorites/view/renderer.ts", "const budget = this.budget;"]
  ],
  invalid: [
    ...casesFor(FEATURE_FILES, "const budget = BUDGETS[context.environment.canvasBudget];"),
    ["features/favorites/view/renderer.ts", "function draw(environment: object): object { return environment; }"],
    ["features/favorites/flows/search.ts", "const { environment } = this.context;"]
  ]
});

runSyntax("rule44", {
  valid: [
    ["features/favorites/favorites.ts", "const columns = GalleryConfig.columns;"],
    ["features/favorites/view/renderer.ts", "const PRELOADED_VIDEO_COUNT = 4;"],
    ["features/favorites/view/renderer.ts", "const config = read();"],
    ["lib/lib.ts", "export const ThumbConfig = { spacing: 4 };"]
  ],
  invalid: [
    ...casesFor(FEATURE_FILES, "const columns = GalleryConfig.columns;"),
    ["features/favorites/types/types.ts", "export interface SearchConfig { limit: number; }"],
    ["core/utils/utils.ts", "export const RetryConfig = { attempts: 3 };"]
  ]
});

runSyntax("rule45", {
  valid: [
    ["features/favorites/favorites.ts", "const enabled = features.has(\"gallery\");"],
    ["app/app.ts", "import { features } from \"@/app/context/features\";"]
  ],
  invalid: [
    ["app/app.ts", "import { FLAGS } from \"@/app/context/flags\";"],
    ["app/app.ts", "import { FLAGS } from \"./flags.ts\";"],
    ["features/favorites/favorites.ts", "const enabled = context.flags.gallery;"],
    ["targets/target.ts", "export interface Flags { gallery: boolean; }"],
    ["core/utils/utils.test.ts", "const flags = { gallery: true };"]
  ]
});
