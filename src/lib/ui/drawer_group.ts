interface DrawerGroupClasses {
  group: string;
  groupTitle: string;
}

export function build(classes: DrawerGroupClasses, title: string, ...children: (HTMLElement | SVGElement)[]): HTMLElement {
  const element = document.createElement("section");

  element.className = classes.group;

  if (title !== "") {
    const heading = document.createElement("h2");

    heading.className = classes.groupTitle;
    heading.textContent = title;
    element.appendChild(heading);
  }
  element.append(...children);
  return element;
}
