import { AutoplayDuration, AutoplaySettings } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayMenuView } from "@/features/gallery/features/autoplay/view/menu";
import { AutoplayProgressView } from "@/features/gallery/features/autoplay/view/progress";
import { AutoplayShell } from "@/features/gallery/features/autoplay/shell/shell";

export class AutoplayView {
  private readonly shell: AutoplayShell;
  private readonly settings: AutoplaySettings;
  private readonly menu: AutoplayMenuView;
  private readonly progress: AutoplayProgressView;

  constructor(shell: AutoplayShell, settings: AutoplaySettings) {
    this.shell = shell;
    this.settings = settings;
    this.menu = new AutoplayMenuView(shell);
    this.progress = new AutoplayProgressView(shell);
    this.render();
  }

  public mount(container: HTMLElement): void {
    container.prepend(this.shell.container);
  }

  public render(): void {
    const { paused, forward, durations } = this.settings;
    const values = { image: durations.image.value, minimumVideo: durations.minimumVideo.value };

    this.menu.render({ paused: paused.value, forward: forward.value, durations: values });
    this.progress.setDurations(values);
  }

  public showContainer(visible: boolean): void {
    this.menu.showContainer(visible);
  }

  public showMenu(visible: boolean): void {
    this.menu.showMenu(visible);
  }

  public holdMenu(held: boolean): void {
    this.menu.holdMenu(held);
  }

  public showSettings(open: boolean): void {
    this.menu.showSettings(open);
  }

  public startProgress(kind: AutoplayDuration): void {
    this.progress.start(kind);
  }

  public stopProgress(): void {
    this.progress.stop();
  }
}
