interface DrawerPanelClasses {
  section: string;
  sectionTitle: string;
}

export function section(classes: DrawerPanelClasses, title: string, ...children: (HTMLElement | SVGElement)[]): HTMLElement {
  const element = document.createElement("section");

  element.className = classes.section;

  if (title !== "") {
    const heading = document.createElement("h2");

    heading.className = classes.sectionTitle;
    heading.textContent = title;
    element.appendChild(heading);
  }
  element.append(...children);
  return element;
}

export function bulletList(items: string[]): HTMLUListElement {
  const list = document.createElement("ul");

  for (const item of items) {
    const entry = document.createElement("li");

    entry.textContent = item;
    list.appendChild(entry);
  }
  return list;
}
