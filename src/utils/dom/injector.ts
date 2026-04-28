export function insertStyle(html: string, id: string | undefined = undefined): void {
  const style = document.createElement("style");

  style.textContent = html.replace("<style>", "").replace("</style>", "");

  if (id !== undefined) {
    id += "-fsg-style";
    const oldStyle = document.getElementById(id);

    if (oldStyle !== null) {
      oldStyle.remove();
    }
    style.id = id;
  }
  document.head.appendChild(style);
}

export function insertHTMLAndExtractStyle(element: HTMLElement, position: InsertPosition, html: string): void {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const styles = Array.from(dom.querySelectorAll("style"));

  for (const style of styles) {
    insertStyle(style.innerHTML);
    style.remove();
  }
  element.insertAdjacentHTML(position, dom.body.innerHTML);
}
