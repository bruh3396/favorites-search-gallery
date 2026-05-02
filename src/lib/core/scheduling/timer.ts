import { Timeout } from "../../../types/async";
import { doNothing } from "../../environment/constants";

export class Timer {
  public waitTime: number;
  public onTimerEnd: () => void;
  private timeout: Timeout;

  constructor(waitTime: number) {
    this.waitTime = waitTime;
    this.onTimerEnd = doNothing;
    this.timeout = undefined;
  }

  public get isRunning(): boolean {
    return this.timeout !== undefined;
  }

  public get isStopped(): boolean {
    return !this.isRunning;
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
