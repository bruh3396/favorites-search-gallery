import {DO_NOTHING} from "../../config/constants";
import {Timeout} from "../../types/primitives/primitives";

export class Timer {
  private readonly waitTime: number;
  private readonly onTimerEnd: () => void;
  private timeout: Timeout;

  constructor(waitTime: number) {
    this.waitTime = waitTime;
    this.onTimerEnd = DO_NOTHING;
    this.timeout = undefined;
  }

  public restart(): void {
    this.stop();
    this.start();
  }

  public stop(): void {
    clearTimeout(this.timeout);
    this.timeout = undefined;
  }

  public start(): void {
    this.timeout = setTimeout(() => {
      this.timeout = undefined;
      this.onTimerEnd();
    }, this.waitTime);
  }
}
