import { DOM_PARSER } from "../../../utils/dom/dom_parser";

export function extractFavoritesPageCount(html: string): number | null {
  const dom = DOM_PARSER.parseFromString(html, "text/html");
  const paginator = dom.querySelector("[name=\"lastpage\"]");

  if (paginator === null) {
    return null;
  }
  const onclick = paginator.getAttribute("onclick");

  if (onclick === null) {
    return null;
  }
  const match = onclick.match(/pid=(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function extractThumbElements(dom: Document): HTMLElement[] {
  return Array.from(dom.querySelectorAll(".thumb")) as HTMLElement[];
}

function extractThumbImageElements(dom: Document): HTMLElement[] {
  return Array.from(dom.querySelectorAll("img"))
    .filter(image => image.src.includes("thumbnail_"))
    .map(image => image.parentElement)
    .filter(thumb => thumb !== null);
}

export function extractFavoriteElements(html: string): HTMLElement[] {
  const dom = DOM_PARSER.parseFromString(html, "text/html");
  const thumbs = extractThumbElements(dom);
  return thumbs.length > 0 ? thumbs : extractThumbImageElements(dom);
}
