import { GridSizing } from "@/core/ui/post_grid/grid_sizing";
import { pickDecodeWidth } from "@/core/ui/post_grid/decode_width_picker";
import { Tile, TileClass, TileProps } from "@/core/ui/post_grid/tile";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { ImageLoader } from "@/core/ui/post_grid/image_loader";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { MediaItem } from "@/core/domain/media/media_item";
import { NO_MEDIA } from "@/core/domain/media/media";
import { Signal } from "@/core/utils/reactive/signal";
import { createImageLoaderService } from "@/testing/image_loader_service";
import { doNothing } from "@/core/utils/function/function_utilities";

const IMAGE: MediaItem = { id: "123", media: { kind: "image", locator: "images/123" } };
const PLACEHOLDER: MediaItem = { id: "456", media: NO_MEDIA };
const PORTRAIT = { width: 1_200, height: 1_800 };
const UNKNOWN = { width: 0, height: 0 };

function setPreviewCached(complete: boolean): void {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(complete);
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
}

type TileOptions = Omit<TileProps, "onPlainClick" | "visibilityObserver" | "imageLoaderService" | "sizing"> &
  Partial<Pick<TileProps, "onPlainClick" | "visibilityObserver" | "imageLoaderService" | "sizing">>;

function drawTile(options: TileOptions): HTMLElement {
  return render(document, () => (
    <Tile
      sizing={new Signal<GridSizing>({ layout: "column", columnCount: 4, gridWidth: 1_000 })}
      visibilityObserver={{ observe: () => () => { } }}
      imageLoaderService={createImageLoaderService()}
      onPlainClick={() => true}
      {...options}
    />
  )).result;
}

function getLink(tile: HTMLElement): HTMLAnchorElement {
  return tile.querySelector<HTMLAnchorElement>(`.${TileClass.link}`)!;
}

function clickLink(tile: HTMLElement, init: MouseEventInit = {}): MouseEvent {
  const click = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });

  getLink(tile).dispatchEvent(click);
  return click;
}

function getPreview(tile: HTMLElement): HTMLImageElement {
  return tile.querySelector(`.${TileClass.link} > .${TileClass.preview}`)!;
}

function readAspectRatio(tile: HTMLElement): string {
  return tile.style.getPropertyValue("--fsg-Tile-aspect-ratio");
}

describe("Tile", () => {
  test("draws the post as a linked preview", () => {
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] });

    expect(tile.dataset.mediaKind).toBe("image");
    expect(getPreview(tile)).not.toBeNull();
  });

  test("puts its actions beside the link", () => {
    const action = document.createElement("button");
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [action] });

    expect(action.closest(`.${TileClass.link}`)).toBeNull();
    expect(tile.contains(action)).toBe(true);
  });

  test("keeps its link focusable but without an address while idle", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], href: "https://posts/123" }));

    expect([link.getAttribute("href"), link.tabIndex, link.target]).toEqual([null, 0, "_blank"]);
  });

  test("addresses its link while pressed, until the pointer leaves", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], href: "https://posts/123" }));

    link.dispatchEvent(new Event("pointerdown"));
    expect(link.getAttribute("href")).toBe("https://posts/123");
    link.dispatchEvent(new Event("pointerleave"));
    expect(link.getAttribute("href")).toBeNull();
  });

  test("addresses its link while it has keyboard focus", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], href: "https://posts/123" }));

    document.body.append(link);
    link.focus();
    link.dispatchEvent(new Event("pointerleave"));
    expect(link.getAttribute("href")).toBe("https://posts/123");
    link.blur();
    expect(link.getAttribute("href")).toBeNull();
  });

  test("leaves its link unaddressed on focus that isn't from the keyboard", () => {
    const link = getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], href: "https://posts/123" }));

    link.dispatchEvent(new FocusEvent("focus"));
    expect(link.getAttribute("href")).toBeNull();
  });

  test("stays out of the tab order without a page to link to", () => {
    expect(getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] })).hasAttribute("tabindex")).toBe(false);
  });

  test("reports a plain click and keeps the link from following once it is handled", () => {
    const onPlainClick = vi.fn(() => true);
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], onPlainClick });

    expect(clickLink(tile).defaultPrevented).toBe(true);
    expect(onPlainClick).toHaveBeenCalledOnce();
  });

  test("reports a plain mouse press once, keeping the click that follows from the link", () => {
    const onPlainClick = vi.fn(() => true);
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], onPlainClick });
    const press = new PointerEvent("pointerdown", { pointerType: "mouse", button: 0, cancelable: true });

    getLink(tile).dispatchEvent(press);
    expect(onPlainClick).toHaveBeenCalledOnce();
    expect(clickLink(tile).defaultPrevented).toBe(true);
    expect([press.defaultPrevented, onPlainClick.mock.calls.length]).toEqual([true, 1]);
  });

  test("leaves a plain click nobody handles to the link", () => {
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], onPlainClick: () => false });

    expect(clickLink(tile).defaultPrevented).toBe(false);
  });

  test("reports a Ctrl or Meta click instead of following the link", () => {
    const onPlainClick = vi.fn();
    const onCtrlClick = vi.fn();
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], onPlainClick, onCtrlClick });
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
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], onPlainClick, onCtrlClick });

    clickLink(tile, { shiftKey: true });
    clickLink(tile, { altKey: true });
    clickLink(tile, { button: 1 });
    expect(onPlainClick).not.toHaveBeenCalled();
    expect(onCtrlClick).not.toHaveBeenCalled();
  });

  test("leaves a Ctrl click to the browser without a Ctrl click handler", () => {
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });

    getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] })).dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });

  test("ignores clicks on an action", () => {
    const onPlainClick = vi.fn();
    const action = document.createElement("button");

    drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [action], onPlainClick });
    action.click();
    expect(onPlainClick).not.toHaveBeenCalled();
  });

  test("holds the post's shape before the preview arrives", () => {
    expect(readAspectRatio(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] }))).toBe("1200 / 1800");
  });

  test("leaves the shape to the stylesheet while the dimensions are unknown", () => {
    expect(readAspectRatio(drawTile({ post: PLACEHOLDER, dimensions: UNKNOWN, actions: [] }))).toBe("");
  });

  test("points its preview at the post's preview address", () => {
    expect(getPreview(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] })).getAttribute("src")).toBe("images/123");
  });

  test("shows a cached preview at once", () => {
    setPreviewCached(true);

    expect(getPreview(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] })).hidden).toBe(false);
  });

  test("hides a preview until it loads", () => {
    setPreviewCached(false);
    const preview = getPreview(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] }));

    expect(preview.hidden).toBe(true);
    preview.dispatchEvent(new Event("load"));
    expect(preview.hidden).toBe(false);
  });

  test("keeps a preview that fails to load hidden", () => {
    setPreviewCached(false);
    const preview = getPreview(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] }));

    preview.dispatchEvent(new Event("error"));
    expect(preview.hidden).toBe(true);
  });

  test("marks its preview entered once the fade ends, so moving the tile doesn't fade it again", () => {
    const preview = getPreview(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [] }));

    expect(preview.dataset.entered).toBeUndefined();
    preview.dispatchEvent(new Event("animationend"));
    expect(preview.dataset.entered).toBe("");
  });

  test("takes its shape from a cached preview at once while the dimensions are unknown", () => {
    setPreviewCached(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLImageElement.prototype, "naturalHeight", "get").mockReturnValue(200);

    expect(readAspectRatio(drawTile({ post: IMAGE, dimensions: UNKNOWN, actions: [] }))).toBe("300 / 200");
  });

  test("takes its shape from the preview while the dimensions are unknown", () => {
    setPreviewCached(false);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLImageElement.prototype, "naturalHeight", "get").mockReturnValue(200);
    const tile = drawTile({ post: IMAGE, dimensions: UNKNOWN, actions: [] });

    getPreview(tile).dispatchEvent(new Event("load"));
    expect(readAspectRatio(tile)).toBe("300 / 200");
  });

  test("shows the HD image once the tile is visible", () => {
    const show = vi.spyOn(ImageLoader.prototype, "show").mockImplementation(doNothing);
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
    drawTile({
      post: IMAGE, dimensions: PORTRAIT, actions: [], imageLoaderService: createImageLoaderService({ enabled: new Signal(true) }), visibilityObserver
    });
    expect(show).not.toHaveBeenCalled();
    reportVisibility(true);
    expect(show).toHaveBeenCalledOnce();
  });

  test("sizes the HD image from the grid's sizing and the post's dimensions", () => {
    const createLoader = vi.spyOn(ImageLoaderService.prototype, "createLoader");
    const sizing = new Signal<GridSizing>({ layout: "row", columnCount: 4, gridWidth: 1_000 });

    onTestFinished(() => {
      vi.restoreAllMocks();
    });
    drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], sizing });
    const targetWidth = createLoader.mock.calls[0][2];

    expect(targetWidth.value).toBe(pickDecodeWidth(sizing.value, PORTRAIT));
    sizing.value = { layout: "row", columnCount: 1, gridWidth: 1_000 };
    expect(targetWidth.value).toBe(pickDecodeWidth(sizing.value, PORTRAIT));
  });

  test("leaves a placeholder's preview without an address", () => {
    const getPreviewUrl = vi.spyOn(ImageLoaderService.prototype, "resolvePreviewUrl");

    onTestFinished(() => {
      vi.restoreAllMocks();
    });
    const tile = drawTile({ post: PLACEHOLDER, dimensions: UNKNOWN, actions: [] });

    expect(getPreviewUrl).not.toHaveBeenCalled();
    expect(getPreview(tile).hasAttribute("src")).toBe(false);
  });
});
