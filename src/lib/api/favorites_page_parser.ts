const PARSER = new DOMParser();

export function extractFavoritesPageCount(html: string): number | null {
  const dom = PARSER.parseFromString(html, "text/html");
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
