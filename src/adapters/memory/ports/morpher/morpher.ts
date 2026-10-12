import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";

export interface RecordedMorph {
  readonly source: MorphSource;
  readonly target: Element | undefined;
}

export class MemoryMorpher implements Morpher {
  public readonly morphs: RecordedMorph[] = [];

  public morph(source: MorphSource, update: () => Element | undefined): void {
    this.morphs.push({ source, target: update() });
  }
}
