import { Media, NO_MEDIA } from "@/core/domain/media/media";
import { Tile, TileClass, TileProps } from "@/core/ui/post_grid/tile";
import { UPSCALE_PACER_CONFIGURATION, UpscalePacer } from "@/core/ui/post_grid/upscale_pacer";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { Upscaler } from "@/core/ui/post_grid/upscaler";
import { doNothing } from "@/core/utils/function/function";

const IMAGE: MediaItem = { id: "123", media: { kind: "image", locator: "images/123" } };
const PLACEHOLDER: MediaItem = { id: "456", media: NO_MEDIA };
const PORTRAIT = { width: 1_200, height: 1_800 };
const UNKNOWN = { width: 0, height: 0 };

function resolvePreviewUrl(media: Media): string {
  return `https://preview/${media.locator}`;
}

function setPreviewCached(complete: boolean): void {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(complete);
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
}

type TileOptions = Omit<TileProps, "onPlainClick" | "upscale" |
  "visibilityObserver" | "onVisibilityChange" | "decodeStill" | "upscalePacer"> &
  Partial<Pick<TileProps, "onPlainClick" | "onVisibilityChange" | "upscale" | "visibilityObserver" | "upscalePacer">>;

function drawTile(options: TileOptions): HTMLElement {
  return render(document, () => (
    <Tile
      upscale={new Signal(false)}
      visibilityObserver={{ observe: () => () => { } }}
      onVisibilityChange={doNothing}
      decodeStill={() => new MemoryRemoteMedia().decodeStill()}
      upscalePacer={new UpscalePacer(UPSCALE_PACER_CONFIGURATION, new MemoryScheduler())}
      onPlainClick={doNothing}
      {...options}
    />
  )).result;
}

function getLink(tile: HTMLElement): HTMLAnchorElement {
  return tile.querySelector<HTMLAnchorElement>(`.${TileClass.link}`)!;
}

function clickLink(tile: HTMLElement, init: MouseEventInit = {}): void {
  getLink(tile).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
}

function getPreview(tile: HTMLElement): HTMLImageElement {
  return tile.querySelector(`.${TileClass.link} > .${TileClass.preview}`)!;
}

function readAspectRatio(tile: HTMLElement): string {
  return tile.style.getPropertyValue("--fsg-Tile-aspect-ratio");
}

describe("Tile", () => {
  test("draws the post as a linked preview", () => {
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl });

    expect(tile.dataset.mediaKind).toBe("image");
    expect(getPreview(tile)).not.toBeNull();
  });

  test("puts its actions beside the link", () => {
    const action = document.createElement("button");
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [action], resolvePreviewUrl });

    expect(action.closest(`.${TileClass.link}`)).toBeNull();
    expect(tile.contains(action)).toBe(true);
  });

  test("keeps its link focusable but without an address while idle", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, href: "https://posts/123" }));

    expect([link.getAttribute("href"), link.tabIndex, link.target]).toEqual([null, 0, "_blank"]);
  });

  test("addresses its link while pressed, until the pointer leaves", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, href: "https://posts/123" }));

    link.dispatchEvent(new Event("pointerdown"));
    expect(link.getAttribute("href")).toBe("https://posts/123");
    link.dispatchEvent(new Event("pointerleave"));
    expect(link.getAttribute("href")).toBeNull();
  });

  test("addresses its link while it has keyboard focus", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, href: "https://posts/123" }));

    document.body.append(link);
    link.focus();
    link.dispatchEvent(new Event("pointerleave"));
    expect(link.getAttribute("href")).toBe("https://posts/123");
    link.blur();
    expect(link.getAttribute("href")).toBeNull();
  });

  test("leaves its link unaddressed on focus that isn't from the keyboard", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, href: "https://posts/123" }));

    link.dispatchEvent(new FocusEvent("focus"));
    expect(link.getAttribute("href")).toBeNull();
  });

  test("stays out of the tab order without a page to link to", () => {
    expect(getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl })).hasAttribute("tabindex")).toBe(false);
  });

  test("reports a plain click", () => {
    const onPlainClick = vi.fn();
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, onPlainClick });

    clickLink(tile);
    expect(onPlainClick).toHaveBeenCalledOnce();
  });

  test("reports a Ctrl or Meta click instead of following the link", () => {
    const onPlainClick = vi.fn();
    const onCtrlClick = vi.fn();
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, onPlainClick, onCtrlClick });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });

    getLink(tile).dispatchEvent(click);
    clickLink(tile, { metaKey: true });
    expect(click.defaultPrevented).toBe(true);
    expect(onCtrlClick).toHaveBeenCalledTimes(2);
    expect(onPlainClick).not.toHaveBeenCalled();
  });

  test("leaves other modified and non-primary clicks to the browser", () => {
    const onPlainClick = vi.fn();
    const onCtrlClick = vi.fn();
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, onPlainClick, onCtrlClick });

    clickLink(tile, { shiftKey: true });
    clickLink(tile, { altKey: true });
    clickLink(tile, { button: 1 });
    expect(onPlainClick).not.toHaveBeenCalled();
    expect(onCtrlClick).not.toHaveBeenCalled();
  });

  test("leaves a Ctrl click to the browser without a Ctrl click handler", () => {
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });

    getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl })).dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });

  test("ignores clicks on an action", () => {
    const onPlainClick = vi.fn();
    const action = document.createElement("button");

    drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [action], resolvePreviewUrl, onPlainClick });
    action.click();
    expect(onPlainClick).not.toHaveBeenCalled();
  });

  test("holds the post's shape before the preview arrives", () => {
    expect(readAspectRatio(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl }))).toBe("1200 / 1800");
  });

  test("leaves the shape to the stylesheet while the dimensions are unknown", () => {
    expect(readAspectRatio(drawTile({ post: PLACEHOLDER, dimensions: UNKNOWN, actions: [], resolvePreviewUrl }))).toBe("");
  });

  test("reports visibility changes", () => {
    let reportVisibility: (visible: boolean) => void = doNothing;
    const onVisibilityChange = vi.fn();
    const visibilityObserver = {
      observe: (_element: Element, onVisibility: (visible: boolean) => void): (() => void) => {
        reportVisibility = onVisibility;
        return doNothing;
      }
    };

    drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, visibilityObserver, onVisibilityChange });
    reportVisibility(true);

    expect(onVisibilityChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  test("shows a cached preview without loading", () => {
    setPreviewCached(true);
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl });

    expect(tile.dataset.loading).toBeUndefined();
    expect(getPreview(tile).src).toBe("https://preview/images/123");
  });

  test("stays loading until the preview loads", () => {
    setPreviewCached(false);
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl });

    expect(tile.dataset.loading).toBe("");
    getPreview(tile).dispatchEvent(new Event("load"));
    expect(tile.dataset.loading).toBeUndefined();
  });

  test("stops loading when the preview fails", () => {
    setPreviewCached(false);
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl });

    getPreview(tile).dispatchEvent(new Event("error"));
    expect(tile.dataset.loading).toBeUndefined();
  });

  test("takes its shape from the preview while the dimensions are unknown", () => {
    setPreviewCached(false);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLImageElement.prototype, "naturalHeight", "get").mockReturnValue(200);
    const tile = drawTile({ post: IMAGE, dimensions: UNKNOWN, actions: [], resolvePreviewUrl });

    getPreview(tile).dispatchEvent(new Event("load"));
    expect(readAspectRatio(tile)).toBe("300 / 200");
  });

  test("upscales only while upscaling is on and the tile is visible", () => {
    const upscale = vi.spyOn(Upscaler.prototype, "upscale").mockImplementation(doNothing);
    const cancel = vi.spyOn(Upscaler.prototype, "cancel").mockImplementation(doNothing);
    const hide = vi.spyOn(Upscaler.prototype, "hide").mockImplementation(doNothing);
    const enabled = new Signal(true);
    let reportVisibility: (visible: boolean) => void = doNothing;
    const visibilityObserver = {
      observe: (_element: Element, onVisibility: (visible: boolean) => void): (() => void) => {
        reportVisibility = onVisibility;
        return doNothing;
      }
    };

    onTestFinished(() => {
      vi.restoreAllMocks();
    });
    drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, upscale: enabled, visibilityObserver });
    expect(cancel).toHaveBeenCalledOnce();
    reportVisibility(true);
    expect(upscale).toHaveBeenCalledOnce();
    enabled.value = false;
    expect(hide).toHaveBeenCalledOnce();
  });

  test("cancels upscaling while paused without hiding a finished upscale, and resumes after", () => {
    const upscale = vi.spyOn(Upscaler.prototype, "upscale").mockImplementation(doNothing);
    const cancel = vi.spyOn(Upscaler.prototype, "cancel").mockImplementation(doNothing);
    const hide = vi.spyOn(Upscaler.prototype, "hide").mockImplementation(doNothing);
    const upscalePaused = new Signal(false);
    const visibilityObserver = {
      observe: (_element: Element, onVisibility: (visible: boolean) => void): (() => void) => {
        onVisibility(true);
        return doNothing;
      }
    };

    onTestFinished(() => {
      vi.restoreAllMocks();
    });
    drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, upscale: new Signal(true), upscalePaused, visibilityObserver });
    upscale.mockClear();
    cancel.mockClear();
    upscalePaused.value = true;
    expect([cancel.mock.calls.length, hide.mock.calls.length, upscale.mock.calls.length]).toEqual([1, 0, 0]);
    upscalePaused.value = false;
    expect(upscale).toHaveBeenCalledOnce();
  });

  test("stays loading without a preview for a placeholder", () => {
    const getPreviewUrl = vi.fn(resolvePreviewUrl);
    const tile = drawTile({ post: PLACEHOLDER, dimensions: UNKNOWN, actions: [], resolvePreviewUrl: getPreviewUrl });

    expect(getPreviewUrl).not.toHaveBeenCalled();
    expect(tile.dataset.loading).toBe("");
    expect(getPreview(tile).hasAttribute("src")).toBe(false);
  });
});
