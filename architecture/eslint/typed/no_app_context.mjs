import { createForbiddenTypeRule } from "#architecture/eslint/typed/forbidden_type.mjs";

export const noAppContext = createForbiddenTypeRule({
  description: "a sub-feature never holds an AppContext, Events, or FeatureBridge",
  messageId: "rule55",
  message: "rule 55: a sub-feature never holds an AppContext, Events, or FeatureBridge, imported or not; take one dependencies object from features/features.ts",
  types: [["src/app/context/context.ts", "AppContext"], ["src/app/context/events.ts", "Events"], ["src/app/context/feature_bridge.ts", "FeatureBridge"]],
  selector: "Identifier:not(ImportSpecifier > Identifier, TSTypeReference > Identifier, TSQualifiedName > Identifier)",
  nodeOf: node => node
});
