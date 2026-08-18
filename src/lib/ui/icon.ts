import { Svg } from "@/assets/svg";

export type IconName = keyof typeof Svg;

const ICON_CLASS = "icon";
const prototypes = new Map<IconName, SVGElement>();

export function icon(name: IconName): SVGElement {
  return getPrototype(name).cloneNode(true) as SVGElement;
}

function getPrototype(name: IconName): SVGElement {
  const cached = prototypes.get(name);

  if (cached !== undefined) {
    return cached;
  }
  const element = new DOMParser().parseFromString(Svg[name], "text/html").body.querySelector("svg");

  if (element === null) {
    throw new Error(`malformed icon svg: ${name}`);
  }
  element.classList.add(ICON_CLASS);
  prototypes.set(name, element);
  return element;
}
