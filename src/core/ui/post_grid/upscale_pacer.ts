import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface UpscalePacerConfiguration {
  readonly quietPeriod: number;
  readonly paintInterval: number;
}

export const UPSCALE_PACER_CONFIGURATION: UpscalePacerConfiguration = { quietPeriod: 500, paintInterval: 25 };

export class UpscalePacer {
  private readonly heldDecodes: Set<() => void>;
  private readonly queuedPaints: (() => void)[];
  private cancelQuietTimer: (() => void) | undefined;
  private isPaintTimerRunning: boolean;

  constructor(private readonly configuration: UpscalePacerConfiguration, private readonly scheduler: Pick<Scheduler, "schedule">) {
    this.heldDecodes = new Set();
    this.queuedPaints = [];
    this.cancelQuietTimer = undefined;
    this.isPaintTimerRunning = false;
  }

  public decodeWhenQuiet(decode: () => void): () => void {
    this.heldDecodes.add(decode);
    this.cancelQuietTimer?.();
    this.cancelQuietTimer = this.scheduler.schedule(() => this.runHeldDecodes(), this.configuration.quietPeriod);
    return () => {
      this.heldDecodes.delete(decode);
    };
  }

  public queuePaint(paint: () => void): void {
    this.queuedPaints.push(paint);

    if (!this.isPaintTimerRunning) {
      this.runNextPaint();
    }
  }

  private runHeldDecodes(): void {
    const decodes = [...this.heldDecodes];

    this.cancelQuietTimer = undefined;
    this.heldDecodes.clear();
    decodes.forEach(decode => decode());
  }

  private runNextPaint(): void {
    const paint = this.queuedPaints.shift();

    this.isPaintTimerRunning = paint !== undefined;

    if (paint !== undefined) {
      paint();
      this.scheduler.schedule(() => this.runNextPaint(), this.configuration.paintInterval);
    }
  }
}
