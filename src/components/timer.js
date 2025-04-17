import {Timeout} from "../types/primitives/primitives";
import {doNothing} from "../config/constants";

export default class Timer {
  private readonly waitTime: number;
  private readonly onTimerEnd: () => void;
  private timeout: Timeout;

  constructor(waitTime: number) {
    this.waitTime = waitTime;
    this.onTimerEnd = doNothing;
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
