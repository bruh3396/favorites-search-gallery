const domParser = new DOMParser();

export function parseHtml(html: string): Document {
  return domParser.parseFromString(html, "text/html");
}
