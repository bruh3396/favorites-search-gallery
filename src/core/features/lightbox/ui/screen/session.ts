import { Readable, effect, untracked } from "@/core/utils/reactive/signal";

export interface LightboxSessionPart {
  start: () => void;
  stop: () => void;
}

export interface LightboxSessionDependencies {
  isOpen: Readable<boolean>;
  parts: readonly LightboxSessionPart[];
}

export class LightboxSession {
  private readonly stopEffect: () => void;
  private isStarted = false;

  constructor(private readonly dependencies: LightboxSessionDependencies) {
    this.stopEffect = effect(() => {
      const isOpen = dependencies.isOpen.value;

      untracked(() => (isOpen ? this.start() : this.stop()));
    });
  }

  public dispose(): void {
    this.stopEffect();
    this.stop();
  }

  private start(): void {
    this.isStarted = true;
    this.dependencies.parts.forEach(part => part.start());
  }

  private stop(): void {
    if (this.isStarted) {
      this.isStarted = false;
      this.dependencies.parts.forEach(part => part.stop());
    }
  }
}
