export function insertStyle(css: string, id: string | undefined = undefined): void {
  const style = document.createElement("style");

  style.textContent = css;

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

export function insertHTML(element: HTMLElement, position: InsertPosition, html: string): void {
  element.insertAdjacentHTML(position, html);
}
