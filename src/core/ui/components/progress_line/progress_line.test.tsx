import { Progress, ProgressLine, ProgressLineClass } from "@/core/ui/components/progress_line/progress_line";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import PROGRESS_LINE_CSS from "@/core/ui/components/progress_line/progress_line.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(initial: Progress): { element: HTMLElement; progress: Signal<Progress>; dispose: () => void } {
  const progress = new Signal<Progress>(initial);
  const { result: element, dispose } = render(document, () => <ProgressLine label="Loading" progress={progress} />);
  return { element, progress, dispose };
}

describe("ProgressLine", () => {
  test("reports a known fraction as a percentage", () => {
    const { element } = setup(0.25);

    expect([element.getAttribute("aria-valuenow"), element.style.getPropertyValue("--fsg-ProgressLine-fraction")]).toEqual(["25", "0.25"]);
  });

  test("clamps a fraction outside 0 to 1", () => {
    const { element, progress } = setup(1.5);

    expect(element.getAttribute("aria-valuenow")).toBe("100");
    progress.value = -1;
    expect(element.getAttribute("aria-valuenow")).toBe("0");
  });

  test("reports no value while the fraction is unknown", () => {
    const { element } = setup("indeterminate");

    expect([element.hidden, element.hasAttribute("aria-valuenow")]).toEqual([false, false]);
  });

  test("hides while idle and follows the progress", () => {
    const { element, progress } = setup("idle");

    expect(element.hidden).toBe(true);
    progress.value = 0.5;
    expect([element.hidden, element.getAttribute("aria-valuenow")]).toEqual([false, "50"]);
  });

  test("names what is progressing", () => {
    expect(setup("idle").element.getAttribute("aria-label")).toBe("Loading");
  });

  test("stops following the progress once disposed", () => {
    const { element, progress, dispose } = setup(0.5);

    dispose();
    progress.value = 1;
    expect(element.getAttribute("aria-valuenow")).toBe("50");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(ProgressLineClass, PROGRESS_LINE_CSS);
  });
});