import { runSyntax } from "#architecture/eslint/testing/syntax_tester.mjs";

const SWITCH = "core/ui/components/switch/switch.ts";
const SWITCH_TEST = "core/ui/components/switch/switch.test.ts";

runSyntax("rule107", {
  valid: [
    [SWITCH, "element.setAttribute(\"role\", \"switch\");"],
    [SWITCH, "const id = post.id;"],
    [SWITCH, "element.querySelector(\".fsg-Switch-thumb\");"],
    [SWITCH_TEST, "screen.getByRole(\"switch\");"],
    ["features/favorites/view/renderer.ts", "element.id = \"gallery\";"]
  ],
  invalid: [
    [SWITCH, "element.id = \"switch\";"],
    [SWITCH, "element.setAttribute(\"id\", \"switch\");"],
    [SWITCH, "const value = element.getAttribute(\"id\");"],
    [SWITCH, "ownerDocument.getElementById(\"switch\");"],
    [SWITCH, "root.querySelector(\"#switch\");"],
    [SWITCH, "root.querySelectorAll(`#${name} .fsg-Switch`);"],
    [SWITCH, "element.closest(\"div#menu\");"],
    [SWITCH_TEST, "root.querySelector(\"#switch\");"],
    ["core/ui/control.ts", "element.id = \"control\";"]
  ]
});

runSyntax("rule108", {
  valid: [
    [SWITCH, "element.dataset.size = size;"],
    [SWITCH, "element.setAttribute(\"aria-checked\", \"true\");"],
    [SWITCH, "element.setAttribute(\"data-size\", \"small\");"],
    [SWITCH, "element.disabled = true;"],
    ["features/favorites/view/renderer.ts", "element.dataset.selected = \"true\";"]
  ],
  invalid: [
    [SWITCH, "element.dataset.checked = \"true\";"],
    [SWITCH, "element.dataset.disabled = \"\";"],
    [SWITCH, "const selected = element.dataset.selected;"],
    [SWITCH, "element.dataset.state = \"open\";"],
    [SWITCH, "element.setAttribute(\"data-pressed\", \"true\");"],
    [SWITCH, "element.toggleAttribute(\"data-expanded\", open);"],
    [SWITCH_TEST, "expect(element.dataset.checked).toBe(\"true\");"]
  ]
});
