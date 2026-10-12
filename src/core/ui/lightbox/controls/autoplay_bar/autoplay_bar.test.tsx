import { LightboxAutoplayBar, LightboxAutoplayBarClass } from "@/core/ui/lightbox/controls/autoplay_bar/autoplay_bar";
import { describe, expect, onTestFinished, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import AUTOPLAY_BAR_CSS from "@/core/ui/lightbox/controls/autoplay_bar/autoplay_bar.css?inline";
import { AutoplayCountdown } from "@/core/ui/lightbox/autoplay/autoplay";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(): { bar: HTMLElement; countdown: Signal<AutoplayCountdown | undefined> } {
  const countdown = new Signal<AutoplayCountdown | undefined>(undefined);
  const { result, dispose } = render(document, () => <LightboxAutoplayBar countdown={countdown} />);

  onTestFinished(dispose);
  return { bar: result as HTMLElement, countdown };
}

function findFill(bar: HTMLElement): HTMLElement | null {
  return bar.querySelector<HTMLElement>(`.${LightboxAutoplayBarClass.fill}`);
}

describe("LightboxAutoplayBar", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxAutoplayBarClass, AUTOPLAY_BAR_CSS);
  });

  test("hides while there is no countdown", () => {
    const { bar } = setup();

    expect([bar.hidden, findFill(bar)]).toEqual([true, null]);
  });

  test("fills over the countdown's duration", () => {
    const { bar, countdown } = setup();

    countdown.value = { duration: 3_000 };
    expect([bar.hidden, findFill(bar)?.style.animationDuration]).toEqual([false, "3000ms"]);
  });

  test("starts a new fill for each countdown", () => {
    const { bar, countdown } = setup();

    countdown.value = { duration: 3_000 };
    const first = findFill(bar);

    countdown.value = { duration: 3_000 };
    expect([bar.children.length, findFill(bar) === first]).toEqual([1, false]);
  });
});
