import { LightboxVideo, LightboxVideoClass } from "@/core/features/lightbox/ui/media/video";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import VIDEO_CSS from "@/core/features/lightbox/ui/media/video.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(): {
  root: HTMLElement;
  element: Signal<HTMLVideoElement | undefined>;
  onClick: () => void;
  onFocusIn: () => void;
} {
  const element = new Signal<HTMLVideoElement | undefined>(undefined);
  const onClick = vi.fn();
  const onFocusIn = vi.fn();
  const { result: root } = render(document, () => <LightboxVideo element={element} onClick={onClick} onFocusIn={onFocusIn} />);
  return { root, element, onClick, onFocusIn };
}

function createVideo(): HTMLVideoElement {
  const video = document.createElement("video");

  video.play = vi.fn(() => Promise.resolve());
  video.pause = vi.fn();
  return video;
}

describe("LightboxVideo", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxVideoClass, VIDEO_CSS);
  });

  test("shows and plays the given video and hides while there is none", () => {
    const { root, element } = setup();
    const video = createVideo();

    expect([root.hidden, root.childElementCount]).toEqual([true, 0]);
    element.value = video;
    expect(root.hidden).toBe(false);
    expect([...root.children]).toEqual([video]);
    expect(video.play).toHaveBeenCalledOnce();
  });

  test("pauses the video it replaces", () => {
    const { root, element } = setup();
    const first = createVideo();

    element.value = first;
    element.value = undefined;
    expect(first.pause).toHaveBeenCalledOnce();
    expect([root.hidden, root.childElementCount]).toEqual([true, 0]);
  });

  test("runs its action on a plain click and claims it", () => {
    const { root, onClick } = setup();
    const event = new MouseEvent("click", { cancelable: true });

    root.dispatchEvent(event);
    expect(onClick).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  test.each(["ctrlKey", "metaKey"] as const)("leaves a click with %s alone", modifier => {
    const { root, onClick } = setup();
    const event = new MouseEvent("click", { cancelable: true, [modifier]: true });

    root.dispatchEvent(event);
    expect(onClick).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  test("reports focus moving into the video", () => {
    const { root, onFocusIn } = setup();

    root.dispatchEvent(new FocusEvent("focusin"));
    expect(onFocusIn).toHaveBeenCalledOnce();
  });
});
