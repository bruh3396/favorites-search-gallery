import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

const ROLLING_WINDOW = 10;

interface Sample {
  time: number;
  count: number;
}

export class FavoritesEta {
  private readonly samples: Sample[] = [];

  constructor(private readonly scheduler: Scheduler) {}

  public getEta(current: number, total: number): string | null {
    this.samples.push({ time: this.scheduler.now(), count: current });

    if (this.samples.length > ROLLING_WINDOW + 1) {
      this.samples.shift();
    }
    const perMillisecond = this.rate();

    if (perMillisecond === null) {
      return null;
    }
    return this.format(Math.ceil((total - current) / perMillisecond / 1_000));
  }

  private rate(): number | null {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const arrived = last.count - first.count;
    const elapsed = last.time - first.time;
    return arrived > 0 && elapsed > 0 ? arrived / elapsed : null;
  }

  private format(seconds: number): string {
    if (seconds >= 60) {
      return `${Math.ceil(seconds / 60)}m`;
    }
    return `${String(seconds).padStart(3, " ")}s`;
  }
}
