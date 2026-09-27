import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { AutoplayDuration } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayShell } from "@/features/gallery/features/autoplay/shell/shell";
import { forceReflow } from "@/utils/browser/element";
import { toSeconds } from "@/utils/pure/number";

export class AutoplayProgressView {
  private readonly bars: Record<AutoplayDuration, HTMLElement>;

  constructor(shell: AutoplayShell) {
    this.bars = shell.progressBars;
  }

  public setDurations(durations: Record<AutoplayDuration, number>): void {
    this.bars.image.style.setProperty("--autoplay-progress-duration", `${toSeconds(durations.image)}s`);
    this.bars.minimumVideo.style.setProperty("--autoplay-progress-duration", `${toSeconds(durations.minimumVideo)}s`);
  }

  public start(kind: AutoplayDuration): void {
    this.stop();
    forceReflow(this.bars[kind]);
    setDataset(this.bars[kind], "animated");
  }

  public stop(): void {
    removeDataset(this.bars.image, "animated");
    removeDataset(this.bars.minimumVideo, "animated");
  }
}
