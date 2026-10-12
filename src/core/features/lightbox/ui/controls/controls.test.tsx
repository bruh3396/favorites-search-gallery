import { LightboxControls, LightboxControlsProps } from "@/core/features/lightbox/ui/controls/controls";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { AutoplayCountdown } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxArrowClass } from "@/core/features/lightbox/ui/controls/arrow/arrow";
import { LightboxAutoplayBarClass } from "@/core/features/lightbox/ui/controls/autoplay_bar/autoplay_bar";
import { LightboxButtonClass } from "@/core/features/lightbox/ui/controls/button/button";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/ui/overlay/visibility";
import { LightboxPositionClass } from "@/core/features/lightbox/ui/controls/position/position";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { doNothing } from "@/core/utils/function/function";

type Action = ReturnType<typeof vi.fn<() => void>>;

interface Setup {
  root: HTMLElement;
  isPlaying: Signal<boolean>;
  countdown: Signal<AutoplayCountdown | undefined>;
  isFullscreen: Signal<boolean>;
  toggleAutoplay: Action;
  toggleFullscreen: Action;
  close: Action;
  showNext: Action;
  showPrevious: Action;
  download: Action;
  openPostPage: Action;
}

function setup(overrides: Partial<LightboxControlsProps<string>> = {}): Setup {
  const isPlaying = new Signal(false);
  const countdown = new Signal<AutoplayCountdown | undefined>(undefined);
  const isFullscreen = new Signal(false);
  const toggleAutoplay = vi.fn<() => void>();
  const toggleFullscreen = vi.fn<() => void>();
  const close = vi.fn<() => void>();
  const showNext = vi.fn<() => void>();
  const showPrevious = vi.fn<() => void>();
  const download = vi.fn<() => void>();
  const openPostPage = vi.fn<() => void>();
  const { result, dispose } = render(document, () => (
    <LightboxControls<string>
      visibility={new LightboxOverlayVisibility({ idleDelay: 1_000, hideSoonDelay: 1_000 }, new MemoryScheduler())}
      current={new Signal<string | undefined>("1")}
      position={new Signal({ index: 36, total: 1_204 })}
      autoplay={{ isPlaying, countdown: countdown as Readable<AutoplayCountdown | undefined>, toggle: toggleAutoplay }}
      fullscreen={{ isFullscreen, toggle: toggleFullscreen }}
      favorites={{ isFavorited: () => false, addFavorite: doNothing, removeFavorite: doNothing }}
      download={download}
      openPostPage={openPostPage}
      close={close}
      showNext={showNext}
      showPrevious={showPrevious}
      {...overrides}
    />
  ));

  onTestFinished(dispose);
  return {
    root: result as HTMLElement, isPlaying, countdown, isFullscreen, toggleAutoplay, toggleFullscreen, close, showNext, showPrevious, download,
    openPostPage
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
    const icons = readIcons(setup({ favorites: undefined, download: undefined, openPostPage: undefined }).root);

    expect(["heart", "download", "postPage"].filter(icon => icons.includes(icon))).toEqual([]);
  });

  test("calls back from its buttons and arrows", () => {
    const { root, toggleAutoplay, toggleFullscreen, close, showNext, showPrevious, download, openPostPage } = setup();

    ["play", "download", "fullscreen", "postPage", "close"].forEach(icon => findButton(root, icon)!.click());
    root.querySelector<HTMLElement>(`.${LightboxArrowClass.root}[data-direction="previous"]`)!.click();
    root.querySelector<HTMLElement>(`.${LightboxArrowClass.root}[data-direction="next"]`)!.click();
    expect([toggleAutoplay, toggleFullscreen, close, showNext, showPrevious, download, openPostPage].map(action => action.mock.calls.length))
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
