export function extractFavoriteElements(source: string | Document): HTMLElement[] {
  const dom = typeof source === "string" ? new DOMParser().parseFromString(source, "text/html") : source;
  const thumbs = extractThumbElements(dom);
  return thumbs.length > 0 ? thumbs : extractThumbImageElements(dom);
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
