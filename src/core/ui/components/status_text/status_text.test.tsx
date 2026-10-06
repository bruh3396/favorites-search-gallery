import { StatusText, StatusTextClass } from "@/core/ui/components/status_text/status_text";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import STATUS_TEXT_CSS from "@/core/ui/components/status_text/status_text.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

describe("StatusText", () => {
  test("shows the text and follows it", () => {
    const text = new Signal("Peeling apples");
    const { result: element } = render(document, () => <StatusText text={text} />);

    expect(element.textContent).toBe("Peeling apples");
    text.value = "Apples peeled";
    expect(element.textContent).toBe("Apples peeled");
  });

  test("announces changes to assistive technology", () => {
    expect(render(document, () => <StatusText text={new Signal("")} />).result.getAttribute("role")).toBe("status");
  });

  test("stops following the text once disposed", () => {
    const text = new Signal("Peeling apples");
    const { result: element, dispose } = render(document, () => <StatusText text={text} />);

    dispose();
    text.value = "Apples peeled";
    expect(element.textContent).toBe("Peeling apples");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(StatusTextClass, STATUS_TEXT_CSS);
  });
});
