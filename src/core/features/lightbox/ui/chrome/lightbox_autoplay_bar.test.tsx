import { LightboxAutoplayBar, LightboxAutoplayBarClass } from "@/core/features/lightbox/ui/chrome/lightbox_autoplay_bar";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import AUTOPLAY_BAR_CSS from "@/core/features/lightbox/ui/chrome/lightbox_autoplay_bar.css?inline";
import { LightboxAutoplayCountdown } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";
import { expectClassesStyled } from "@/testing/css";

describe("LightboxAutoplayBar", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxAutoplayBarClass, AUTOPLAY_BAR_CSS);
  });

  test("fills over the countdown's duration and hides while there is none", () => {
    const countdown = new Signal<LightboxAutoplayCountdown | undefined>(undefined);
    const { result: bar } = render(document, () => <LightboxAutoplayBar countdown={countdown} />);

    expect([bar.hidden, bar.childElementCount]).toEqual([true, 0]);
    countdown.value = { item: createPost(), duration: 5_000 };
    expect(bar.hidden).toBe(false);
    expect((bar.firstElementChild as HTMLElement).style.animationDuration).toBe("5000ms");
    countdown.value = undefined;
    expect([bar.hidden, bar.childElementCount]).toEqual([true, 0]);
  });

  test("restarts the fill for each new countdown", () => {
    const countdown = new Signal<LightboxAutoplayCountdown | undefined>({ item: createPost({ id: "1" }), duration: 5_000 });
    const { result: bar } = render(document, () => <LightboxAutoplayBar countdown={countdown} />);
    const first = bar.firstElementChild;

    countdown.value = { item: createPost({ id: "2" }), duration: 5_000 };
    expect(bar.firstElementChild).not.toBe(first);
  });
});
