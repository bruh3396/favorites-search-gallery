interface AppFontFace {
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
