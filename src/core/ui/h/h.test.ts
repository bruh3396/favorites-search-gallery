import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal, effect } from "@/core/utils/reactive/signal";

describe("h", () => {
  test("creates the element with its properties", () => {
    const { result: input } = render(document, () => h("input", { className: "field", type: "range", disabled: true }));

    expect([input.tagName, input.className, input.type, input.disabled]).toEqual(["INPUT", "field", "range", true]);
  });

  test("sets aria attributes and the role as attributes", () => {
    const { result: element } = render(document, () => h("div", { role: "status", "aria-label": "Status" }));

    expect([element.getAttribute("role"), element.getAttribute("aria-label")]).toEqual(["status", "Status"]);
  });

  test("sets the dataset", () => {
    expect(render(document, () => h("div", { dataset: { postId: "1" } })).result.dataset.postId).toBe("1");
  });

  test("follows a property, an attribute, and a data value given as signals", () => {
    const hidden = new Signal(false);
    const current = new Signal<string | null>("page");
    const id = new Signal("1");
    const { result: element } = render(document, () => h("button", { hidden, "aria-current": current, dataset: { id } }));

    hidden.value = true;
    current.value = null;
    id.value = "2";
    expect([element.hidden, element.hasAttribute("aria-current"), element.dataset.id]).toEqual([true, false, "2"]);
  });

  test("listens for the events given as on props", () => {
    const onClick = vi.fn();
    const { result: button } = render(document, () => h("button", { onClick }));

    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("appends nodes, text, and nested lists of children, skipping empty ones", () => {
    const { result: element } = render(document, () => h("div", {}, "a", null, [h("b", {}, "b"), [false, "c"]], undefined));

    expect(element.innerHTML).toBe("a<b>b</b>c");
  });

  test("follows text given as a signal", () => {
    const text = new Signal("a");
    const { result: element } = render(document, () => h("p", {}, text));

    text.value = "b";
    expect(element.textContent).toBe("b");
  });

  test("calls a component with its props and returns what it builds", () => {
    const Greeting = ({ name }: { name: string }): HTMLElement => h("p", {}, `Hi ${name}`);

    expect(render(document, () => h(Greeting, { name: "Ann" })).result.outerHTML).toBe("<p>Hi Ann</p>");
  });

  test("keeps an enclosing effect from depending on what a component reads while built", () => {
    const read = new Signal("a");
    const Reader = (): HTMLElement => h("p", {}, read.value);
    let runCount = 0;

    render(document, () => effect(() => {
      runCount += 1;
      h(Reader, {});
    }));
    read.value = "b";
    expect(runCount).toBe(1);
  });

  test("throws outside render", () => {
    expect(() => h("div", {})).toThrow("No document was provided to this scope");
  });
});

describe("render", () => {
  test("builds in the given document", () => {
    const other = document.implementation.createHTMLDocument();

    expect(render(other, () => h("div", {})).result.ownerDocument).toBe(other);
  });

  test("stops following every signal once disposed", () => {
    const text = new Signal("a");
    const hidden = new Signal(false);
    const { result: element, dispose } = render(document, () => h("p", { hidden }, text));

    dispose();
    text.value = "b";
    hidden.value = true;
    expect([element.textContent, element.hidden]).toEqual(["a", false]);
  });
});
