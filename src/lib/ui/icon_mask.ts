import { IconName } from "@/lib/ui/icon";
import { Svg } from "@/assets/svg/svg";

const MASK_PROPERTIES = "background-color: currentColor; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; -webkit-mask-size: contain; mask-size: contain;";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function iconMaskDataUri(name: IconName): string {
  return `url("data:image/svg+xml,${encodeSvg(withNamespace(Svg[name]))}")`;
}

export function iconMaskStyles(selector: string, icons: readonly IconName[]): string {
  const shared = `${selector} { ${MASK_PROPERTIES} }`;
  const perIcon = icons
    .map((name) => `${selector}[data-icon="${name}"] { -webkit-mask-image: ${iconMaskDataUri(name)}; mask-image: ${iconMaskDataUri(name)}; }`)
    .join("\n");
  return `${shared}\n${perIcon}`;
}

function withNamespace(svg: string): string {
  if (svg.includes("xmlns=")) {
    return svg;
  }
  return svg.replace("<svg", `<svg xmlns="${SVG_NAMESPACE}"`);
}

function encodeSvg(svg: string): string {
  return encodeURIComponent(svg).replace(/%20/g, " ");
}
