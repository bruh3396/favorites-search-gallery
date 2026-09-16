import { Timeout } from "@/types/async";

const REOPEN_COOLDOWN = 300;

export class ReopenCooldown {
  private timeoutId: Timeout | null = null;

  public isCoolingDown(): boolean {
    return this.timeoutId !== null;
  }

  public start(onElapsed: () => void): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      onElapsed();
    }, REOPEN_COOLDOWN);
  }
}
