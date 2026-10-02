import { FEATURE_ENTRY, OUTSIDE_NEW_CODE, SAME_FEATURE } from "#architecture/eslint/imports/selectors.mjs";

export const MESSAGES = {
  rule16: "rule 16: a feature may not import another feature",
  rule17: "rule 17: a sub-feature is imported only through its entry, by its host's entry and features/features.ts, or through its types/types.ts",
  rule18: "rule 18: only control/, view/, and the feature entry may import shell/",
  rule18b: "rule 18: shell/ may import only its feature's types/, core/domain, core/boundary, core/ui, core/utils, and the app's environment, flags, and shell",
  rule19: "rule 19: model/ and view/ are reached only through model/model.ts and view/view.ts, from the feature entry, control/, flows/, or features/features.ts",
  rule55: "rule 55: a sub-feature may not import AppContext, events, or the feature bridge; take one dependencies object from features/features.ts"
};

export const POLICIES = [
  {
    from: { element: OUTSIDE_NEW_CODE },
    disallow: [{ to: { element: { type: ["features/model", "features/view"] } } }],
    message: MESSAGES.rule19
  },
  {
    from: { element: [{ type: ["features/control", "features/flows", "features/features/facade"] }, FEATURE_ENTRY] },
    allow: [
      { to: { element: { type: "features/model", fileInternalPath: "model.ts", captured: SAME_FEATURE } } },
      { to: { element: { type: "features/view", fileInternalPath: "view.ts", captured: SAME_FEATURE } } }
    ]
  },
  {
    from: { element: OUTSIDE_NEW_CODE },
    disallow: [{ to: { element: { type: "features/features" } } }],
    message: MESSAGES.rule17
  },
  {
    from: { element: [{ type: "features/features/facade" }, FEATURE_ENTRY] },
    allow: [{ to: { element: { type: "features/features", captured: SAME_FEATURE, fileInternalPath: "{{ to.element.captured.subFeature }}.ts" } } }]
  },
  {
    from: { element: OUTSIDE_NEW_CODE },
    allow: [{ to: { element: { type: "features/features", fileInternalPath: "types/types.ts" } } }]
  },
  {
    from: { element: OUTSIDE_NEW_CODE },
    disallow: [{ to: { element: { type: "features/shell" } } }],
    message: MESSAGES.rule18
  },
  {
    from: { element: [{ type: ["features/control", "features/view"] }, FEATURE_ENTRY] },
    allow: [{ to: { element: { type: "features/shell", captured: SAME_FEATURE } } }]
  },
  {
    from: { element: { type: "features/shell" } },
    disallow: [
      { to: { element: { type: "!{features/types,core/domain,core/boundary,core/ui,core/utils,legacy}" } } },
      { to: { file: { path: "**/app/context/!(environment|flags|shell).ts" } } }
    ],
    message: MESSAGES.rule18b
  },
  {
    from: { element: { type: "features/**" } },
    disallow: [{ to: { element: { type: "features/**", captured: { feature: "!{{ from.element.captured.feature }}" } } } }],
    message: MESSAGES.rule16
  },
  {
    from: { element: { type: "features/features" } },
    disallow: [
      { to: { file: { path: "**/app/context/{context,events,feature_bridge}.ts" } } },
      { to: { element: { type: "core/context" } } }
    ],
    message: MESSAGES.rule55
  }
];
