import { Tile, TileClass, TileProps } from "@/core/ui/post_grid/tile";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";

const IMAGE: MediaItem = { id: "123", media: { kind: "image", locator: "images/123" } };
const PLACEHOLDER: MediaItem = { id: "456", media: { kind: "image", locator: "" } };
const PORTRAIT = { width: 1_200, height: 1_800 };
const UNKNOWN = { width: 0, height: 0 };

function resolvePreviewUrl(media: Media): Promise<string> {
  return Promise.resolve(`https://preview/${media.locator}`);
}

function drawTile(options: Omit<TileProps, "onActivate"> & Partial<Pick<TileProps, "onActivate">>): HTMLElement {
  return render(document, () => <Tile onActivate={doNothing} {...options} />).result;
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

    expect(tile.className).toBe(TileClass.root);
    expect(tile.dataset.mediaKind).toBe("image");
    expect(getPreview(tile)).not.toBeNull();
  });

  test("puts its actions beside the link", () => {
    const action = document.createElement("button");
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [action], resolvePreviewUrl });

    expect(action.parentElement?.className).toBe(TileClass.actions);
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

  test("stays out of the tab order without a page to link to", () => {
    expect(getLink(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl })).hasAttribute("tabindex")).toBe(false);
  });

  test("activates on a plain click", () => {
    const onActivate = vi.fn();
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, onActivate });

    clickLink(tile);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent));
  });

  test("leaves modified and non-primary clicks to the browser", () => {
    const onActivate = vi.fn();
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl, onActivate });

    clickLink(tile, { ctrlKey: true });
    clickLink(tile, { metaKey: true });
    clickLink(tile, { shiftKey: true });
    clickLink(tile, { altKey: true });
    clickLink(tile, { button: 1 });
    expect(onActivate).not.toHaveBeenCalled();
  });

  test("doesn't activate when an action is clicked", () => {
    const onActivate = vi.fn();
    const action = document.createElement("button");

    drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [action], resolvePreviewUrl, onActivate });
    action.click();
    expect(onActivate).not.toHaveBeenCalled();
  });

  test("holds the post's shape before the preview arrives", () => {
    expect(readAspectRatio(drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl }))).toBe("1200 / 1800");
  });

  test("leaves the shape to the stylesheet while the dimensions are unknown", () => {
    expect(readAspectRatio(drawTile({ post: PLACEHOLDER, dimensions: UNKNOWN, actions: [], resolvePreviewUrl }))).toBe("");
  });

  test("shows the preview and stops loading once it resolves", async() => {
    const tile = drawTile({ post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl });

    expect(tile.dataset.loading).toBe("");
    await vi.waitFor(() => expect(tile.dataset.loading).toBeUndefined());
    expect(getPreview(tile).src).toBe("https://preview/images/123");
  });

  test("stays loading without a preview for a placeholder", async() => {
    const resolve = vi.fn(resolvePreviewUrl);
    const tile = drawTile({ post: PLACEHOLDER, dimensions: UNKNOWN, actions: [], resolvePreviewUrl: resolve });

    await Promise.resolve();
    expect(resolve).not.toHaveBeenCalled();
    expect(tile.dataset.loading).toBe("");
    expect(getPreview(tile).hasAttribute("src")).toBe(false);
  });
});
