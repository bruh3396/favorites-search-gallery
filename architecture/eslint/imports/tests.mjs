export const MESSAGES = {
  rule13: "rule 13: testing/ may be imported only by tests and other testing/ folders"
};

export const POLICIES = [
  {
    from: { element: { type: "!testing" } },
    disallow: [{ to: { element: { type: "testing" } } }],
    message: MESSAGES.rule13
  },
  {
    from: [{ file: { categories: "test" } }, { element: { type: "testing" } }],
    allow: [
      { to: { element: { type: "adapters/**", captured: { name: "memory" } } } },
      { to: { element: { type: "testing" } } }
    ]
  }
];
