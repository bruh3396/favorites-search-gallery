export const MESSAGES = {
  rule4: "rule 4: core/ui may import only core/domain and core/ui",
  rule4b: "rule 4: core/ui is imported only by feature view/, control/, and shell/, by lib/ui/ and utils/browser/ until they dissolve, and by targets for styles.css"
};

export const POLICIES = [
  {
    from: { element: { type: "core/ui" } },
    disallow: [{ to: { element: { type: "!{core/domain,core/ui}" } } }],
    message: MESSAGES.rule4
  },
  {
    from: { element: { type: "!core/ui" } },
    disallow: [{ to: { element: { type: "core/ui" } } }],
    message: MESSAGES.rule4b
  },
  {
    from: [{ element: { type: ["features/view", "features/control", "features/shell"] } }, { file: { path: "**/src/{lib/ui,utils/browser}/**" } }],
    allow: [{ to: { element: { type: "core/ui" } } }]
  },
  {
    from: { element: { type: "targets" } },
    allow: [{ to: { element: { type: "core/ui", fileInternalPath: "styles.css" } } }]
  }
];
