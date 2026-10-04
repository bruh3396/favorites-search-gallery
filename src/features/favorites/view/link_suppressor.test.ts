import { afterEach, describe, expect, test } from "vitest";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { FavoritesLinkSuppressor } from "@/features/favorites/view/link_suppressor";
import { postPageUrl } from "@/adapters/rule34/client/post_page";

function createThumb(id: string): HTMLElement {
  const thumb = document.createElement("div");
  const link = document.createElement("a");

  thumb.className = "post";
  thumb.id = id;
  link.href = postPageUrl(id);
  link.append(document.createElement("img"));
  thumb.append(link);
  document.body.append(thumb);
  return thumb;
}

function hover(suppressor: FavoritesLinkSuppressor, target: Element): void {
  target.addEventListener("mouseover", (event) => suppressor.suppressLinkOnHoveredThumb(new EnhancedMouseEvent(event as MouseEvent)), { once: true });
  target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
}

function queryImage(thumb: HTMLElement): HTMLElement {
  return thumb.querySelector("img") as HTMLElement;
}

function readHref(thumb: HTMLElement): string | null {
  return thumb.querySelector("a")?.getAttribute("href") ?? null;
}

describe("FavoritesLinkSuppressor", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test("the hovered thumb loses its link", () => {
    const suppressor = new FavoritesLinkSuppressor(postPageUrl);
    const apple = createThumb("1");

    hover(suppressor, queryImage(apple));
    expect(readHref(apple)).toBeNull();
  });

  test("moving to another thumb gives the previous one its link back", () => {
    const suppressor = new FavoritesLinkSuppressor(postPageUrl);
    const apple = createThumb("1");
    const banana = createThumb("2");

    hover(suppressor, queryImage(apple));
    hover(suppressor, queryImage(banana));
    expect(readHref(apple)).toBe(postPageUrl("1"));
    expect(readHref(banana)).toBeNull();
  });

  test("hovering the same thumb again or leaving the thumbs changes nothing", () => {
    const suppressor = new FavoritesLinkSuppressor(postPageUrl);
    const apple = createThumb("1");

    hover(suppressor, queryImage(apple));
    hover(suppressor, queryImage(apple));
    hover(suppressor, document.body);
    expect(readHref(apple)).toBeNull();
  });
});
