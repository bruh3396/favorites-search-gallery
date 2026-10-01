import { OLD_CODE } from "#architecture/eslint/imports/selectors.mjs";

export const MESSAGES = {
  rule8: "rule 8: an adapter may import only core/boundary, core/domain, core/utils, and its own folder",
  rule9: "rule 9: an adapter's client/ may not import its ports/ or environment/",
  rule10: "rule 10: an adapter's port folder may not import another port folder or environment/, and environment/ may not import ports/",
  rule11: "rule 11: an adapter's client/ may not import core/boundary/ports/",
  rule12: "rule 12: only targets may import adapters, and only an adapter's entries (client/client.ts, client/<server>/client.ts, ports/<port>/<port>.ts, environment/environment.ts)",
  rule63: "rule 63: a port adapter may import only its own core port"
};

export const POLICIES = [
  {
    from: { element: OLD_CODE },
    disallow: [{ to: { element: { type: "adapters/**" } } }],
    message: MESSAGES.rule12
  },
  {
    from: { element: { type: "adapters/**" } },
    disallow: [
      { to: { element: { type: "!{core/domain,core/boundary,core/boundary/ports,core/utils,adapters/**}" } } },
      { to: { element: { type: "adapters/**", captured: { name: "!{{ from.element.captured.name }}" } } } }
    ],
    message: MESSAGES.rule8
  },
  {
    from: { element: { type: "adapters/client" } },
    disallow: [{ to: { element: { type: ["adapters/ports", "adapters/environment"], captured: { name: "{{ from.element.captured.name }}" } } } }],
    message: MESSAGES.rule9
  },
  {
    from: { element: { type: "adapters/ports" } },
    disallow: [
      { to: { element: { type: "adapters/ports", captured: { name: "{{ from.element.captured.name }}", port: "!{{ from.element.captured.port }}" } } } },
      { to: { element: { type: "adapters/environment", captured: { name: "{{ from.element.captured.name }}" } } } }
    ],
    message: MESSAGES.rule10
  },
  {
    from: { element: { type: "adapters/environment" } },
    disallow: [{ to: { element: { type: "adapters/ports", captured: { name: "{{ from.element.captured.name }}" } } } }],
    message: MESSAGES.rule10
  },
  {
    from: { element: { type: "adapters/client" } },
    disallow: [{ to: { element: { type: "core/boundary/ports" } } }],
    message: MESSAGES.rule11
  },
  {
    from: { element: { type: "adapters/ports" } },
    disallow: [{ to: { element: { type: "core/boundary/ports", fileInternalPath: "!{{ from.element.captured.port }}.ts" } } }],
    message: MESSAGES.rule63
  },
  {
    from: { element: { type: "targets" } },
    disallow: [
      { to: { element: { type: "adapters/client", fileInternalPath: "!{client.ts,*/client.ts}" } } },
      { to: { element: { type: "adapters/ports", fileInternalPath: "!{{ to.element.captured.port }}.ts" } } },
      { to: { element: { type: "adapters/environment", fileInternalPath: "!environment.ts" } } }
    ],
    message: MESSAGES.rule12
  }
];
