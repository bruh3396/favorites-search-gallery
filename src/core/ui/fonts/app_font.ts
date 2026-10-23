export interface AppFontFace {
  readonly family: string;
  readonly source: string;
  readonly weight: string;
}

export interface AppFont {
  readonly name: string;
  readonly text: string;
  readonly numeric: string;
  readonly faces: readonly AppFontFace[];
}

export function installAppFont(root: HTMLElement, font: AppFont): void {
  for (const face of font.faces) {
    root.ownerDocument.fonts.add(new FontFace(face.family, `url(${face.source})`, { weight: face.weight }));
  }
  root.style.setProperty("--fsg-font-family", font.text);
  root.style.setProperty("--fsg-font-family-numeric", font.numeric);
}
