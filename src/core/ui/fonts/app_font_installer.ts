import { AppFont } from "@/core/ui/fonts/app_font";

export function installAppFont(root: HTMLElement, appFont: AppFont): void {
  for (const appFontFace of appFont.faces) {
    root.ownerDocument.fonts.add(new FontFace(appFontFace.family, `url(${appFontFace.source})`, { weight: appFontFace.weight }));
  }
  root.style.setProperty("--fsg-font-family", appFont.text);
  root.style.setProperty("--fsg-font-family-numeric", appFont.numeric);
}
