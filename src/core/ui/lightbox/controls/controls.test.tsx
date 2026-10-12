import { LightboxControls, LightboxControlsProps } from "@/core/ui/lightbox/controls/controls";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { AutoplayCountdown } from "@/core/ui/lightbox/autoplay/autoplay";
import { LightboxArrowClass } from "@/core/ui/lightbox/controls/arrow/arrow";
import { LightboxAutoplayBarClass } from "@/core/ui/lightbox/controls/autoplay_bar/autoplay_bar";
import { LightboxButtonClass } from "@/core/ui/lightbox/controls/button/button";
import { LightboxPositionClass } from "@/core/ui/lightbox/controls/position/position";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { OverlayVisibility } from "@/core/ui/lightbox/overlay/visibility";
import { doNothing } from "@/core/utils/function/function";

type Action = ReturnType<typeof vi.fn<() => void>>;

interface Setup {
  root: HTMLElement;
  isPlaying: Signal<boolean>;
  countdown: Signal<AutoplayCountdown | undefined>;
  isFullscreen: Signal<boolean>;
  toggleAutoplay: Action;
  toggleFullscreen: Action;
  onClose: Action;
  onShowNext: Action;
  onShowPrevious: Action;
  onDownload: Action;
  onOpenPostPage: Action;
}

function setup(overrides: Partial<LightboxControlsProps<string>> = {}): Setup {
  const isPlaying = new Signal(false);
  const countdown = new Signal<AutoplayCountdown | undefined>(undefined);
  const isFullscreen = new Signal(false);
  const toggleAutoplay = vi.fn<() => void>();
  const toggleFullscreen = vi.fn<() => void>();
  const onClose = vi.fn<() => void>();
  const onShowNext = vi.fn<() => void>();
  const onShowPrevious = vi.fn<() => void>();
  const onDownload = vi.fn<() => void>();
  const onOpenPostPage = vi.fn<() => void>();
  const { result, dispose } = render(document, () => (
    <LightboxControls<string>
      visibility={new OverlayVisibility({ idleDelay: 1_000, shortDelay: 1_000 }, new MemoryScheduler())}
      current={new Signal<string | undefined>("1")}
      position={new Signal({ index: 36, total: 1_204 })}
      autoplay={{ isPlaying, countdown: countdown as Readable<AutoplayCountdown | undefined>, toggle: toggleAutoplay }}
      fullscreen={{ isFullscreen, toggle: toggleFullscreen }}
      favorites={{ isFavorited: () => false, addFavorite: doNothing, removeFavorite: doNothing }}
      onDownload={onDownload}
      onOpenPostPage={onOpenPostPage}
      onClose={onClose}
      onShowNext={onShowNext}
      onShowPrevious={onShowPrevious}
      {...overrides}
    />
  ));

  onTestFinished(dispose);
  return {
    root: result as HTMLElement, isPlaying, countdown, isFullscreen, toggleAutoplay, toggleFullscreen, onClose, onShowNext, onShowPrevious, onDownload,
    onOpenPostPage
  };
}

function findButton(root: HTMLElement, icon: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`.${LightboxButtonClass.root}[data-icon="${icon}"]`);
}

function readIcons(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>(`.${LightboxButtonClass.root}`)].map(button => button.dataset.icon!);
}

describe("LightboxControls", () => {
  test("shows the shown post's place", () => {
    const { root } = setup();

    expect(root.querySelector(`.${LightboxPositionClass.root}`)!.textContent).toBe(`37 / ${(1_204).toLocaleString()}`);
  });

  test("leaves out the buttons it has no callback for", () => {
    const icons = readIcons(setup({ favorites: undefined, onDownload: undefined, onOpenPostPage: undefined }).root);

    expect(["heart", "download", "postPage"].filter(icon => icons.includes(icon))).toEqual([]);
  });

  test("calls back from its buttons and arrows", () => {
    const { root, toggleAutoplay, toggleFullscreen, onClose, onShowNext, onShowPrevious, onDownload, onOpenPostPage } = setup();

    ["play", "download", "fullscreen", "postPage", "close"].forEach(icon => findButton(root, icon)!.click());
    root.querySelector<HTMLElement>(`.${LightboxArrowClass.root}[data-direction="previous"]`)!.click();
    root.querySelector<HTMLElement>(`.${LightboxArrowClass.root}[data-direction="next"]`)!.click();
    expect([toggleAutoplay, toggleFullscreen, onClose, onShowNext, onShowPrevious, onDownload, onOpenPostPage].map(action => action.mock.calls.length))
      .toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  test("shows a pressed pause button while autoplay plays", () => {
    const { root, isPlaying } = setup();

    isPlaying.value = true;
    expect(findButton(root, "pause")?.getAttribute("aria-pressed")).toBe("true");
  });

  test("shows autoplay's countdown on its top edge", () => {
    const { root, countdown } = setup();
    const bar = root.querySelector<HTMLElement>(`.${LightboxAutoplayBarClass.root}`)!;

    countdown.value = { duration: 3_000 };
    expect(bar.hidden).toBe(false);
  });

  test("offers to leave fullscreen while in it", () => {
    const { root, isFullscreen } = setup();

    isFullscreen.value = true;
    expect([findButton(root, "fullscreen"), findButton(root, "exitFullscreen")]).toEqual([null, expect.any(HTMLElement)]);
  });
});
