export const MESSAGES = {
  rule4: "rule 4: core/ui may import only core/domain, core/utils, and core/ui",
  rule4b: "rule 4: core/ui is imported only by feature view/, control/, and shell/, by targets for styles.css, and by targets/kit, which renders the components; legacy never imports it",
  rule4c: "rule 4: a component imports only core/ui/control.ts, core/utils, core/domain, and its own folder; never a sibling component"
};

const UI = "core/ui{,/components}";

export const POLICIES = [
  {
    from: { element: { type: UI } },
    disallow: [{ to: { element: { type: `!{core/domain,core/utils,${UI}}` } } }],
    message: MESSAGES.rule4
  },
  {
    from: { element: { type: "core/ui/components" } },
    disallow: [
      { to: { element: { type: "core/ui", fileInternalPath: "!control.ts" } } },
      { to: { element: { type: "core/ui/components", captured: { component: "!{{ from.element.captured.component }}" } } } }
    ],
    message: MESSAGES.rule4c
  },
  {
    from: { element: { type: `!${UI}` } },
    disallow: [{ to: { element: { type: UI } } }],
    message: MESSAGES.rule4b
  },
  {
    from: { element: { type: ["features/view", "features/control", "features/shell"] } },
    allow: [{ to: { element: { type: UI } } }]
  },
  {
    from: { element: { type: "targets" } },
    allow: [{ to: { element: { type: "core/ui", fileInternalPath: "styles.css" } } }]
  },
  {
    from: { file: { path: "**/src/targets/kit/**" } },
    allow: [{ to: { element: { type: UI } } }]
  }
];
