import { CORE_FEATURES, LEGACY_FEATURES } from "#architecture/eslint/imports/selectors.mjs";

export const MESSAGES = {
  rule1: "rule 1: new code (core/, adapters/, targets/) may not import legacy folders; move the dependency first",
  rule2: "rule 2: core/domain may import only core/domain and core/utils",
  rule3: "rule 3: a port folder (the port and its decorators) may import only core/domain, the environment, core/utils, and other ports",
  rule7: "rule 7: core may not import adapters/ or targets/",
  rule105: "rule 105: core/utils may import only core/boundary and core/utils",
  rule106: "rule 106: core/context may import only core/domain, core/boundary, and core/context",
  rule109: "rule 109: core/search may import only core/domain, core/utils, and core/search"
};

export const POLICIES = [
  {
    from: { element: [{ type: ["core/**", "adapters/**", "targets"] }, CORE_FEATURES] },
    disallow: [{ to: { element: { type: "legacy" } } }, { to: { element: LEGACY_FEATURES } }],
    message: MESSAGES.rule1
  },
  {
    from: { element: [{ type: "core/**" }, CORE_FEATURES] },
    disallow: [{ to: { element: { type: ["adapters/**", "targets"] } } }],
    message: MESSAGES.rule7
  },
  {
    from: { element: { type: "core/domain" } },
    disallow: [{ to: { element: { type: "!{core/domain,core/utils}" } } }],
    message: MESSAGES.rule2
  },
  {
    from: { element: { type: "core/boundary/ports" } },
    disallow: [{ to: { element: { type: "!{core/domain,core/boundary,core/boundary/ports,core/utils}" } } }],
    message: MESSAGES.rule3
  },
  {
    from: { element: { type: "core/utils" } },
    disallow: [{ to: { element: { type: "!{core/boundary,core/boundary/ports,core/utils}" } } }],
    message: MESSAGES.rule105
  },
  {
    from: { element: { type: "core/context" } },
    disallow: [{ to: { element: { type: "!{core/domain,core/boundary,core/boundary/ports,core/context}" } } }],
    message: MESSAGES.rule106
  },
  {
    from: { element: { type: "core/search" } },
    disallow: [{ to: { element: { type: "!{core/domain,core/utils,core/search}" } } }],
    message: MESSAGES.rule109
  }
];
