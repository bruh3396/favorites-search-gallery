import { StatusTextClass, createStatusText } from "@/core/ui/components/status_text/status_text";
import { describe, expect, test } from "vitest";
import STATUS_TEXT_CSS from "@/core/ui/components/status_text/status_text.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

describe("createStatusText", () => {
  test("shows the text and follows it", () => {
    const text = new Signal("Peeling apples");
    const { element } = createStatusText(document, { text });

    expect(element.textContent).toBe("Peeling apples");
    text.value = "Apples peeled";
    expect(element.textContent).toBe("Apples peeled");
  });

  test("announces changes to assistive technology", () => {
    expect(createStatusText(document, { text: new Signal("") }).element.getAttribute("role")).toBe("status");
  });

  test("stops following the text once disposed", () => {
    const text = new Signal("Peeling apples");
    const { element, dispose } = createStatusText(document, { text });

    dispose();
    text.value = "Apples peeled";
    expect(element.textContent).toBe("Peeling apples");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(StatusTextClass, STATUS_TEXT_CSS);
  });
});
