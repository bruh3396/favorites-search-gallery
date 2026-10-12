export type MorphSource = Readonly<HTMLImageElement | HTMLCanvasElement | HTMLVideoElement>;

export interface Morpher {
  morph: (source: MorphSource, update: () => Element | undefined) => void;
}
