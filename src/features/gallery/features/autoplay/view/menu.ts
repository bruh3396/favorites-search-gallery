import * as Icons from "@/assets/svg/icons";
import { AutoplayScene } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayShell } from "@/features/gallery/features/autoplay/shell/shell";
import { createObjectUrlFromSvg } from "@/utils/browser/image";
import { toSeconds } from "@/utils/pure/number";
import { toggleDataset } from "@/utils/browser/dataset";

export class AutoplayMenuView {
  private readonly shell: AutoplayShell;
  private readonly playIcon: string;
  private readonly pauseIcon: string;

  constructor(shell: AutoplayShell) {
    this.shell = shell;
    this.playIcon = createObjectUrlFromSvg(Icons.PLAY);
    this.pauseIcon = createObjectUrlFromSvg(Icons.PAUSE);
    shell.settingsButton.src = createObjectUrlFromSvg(Icons.TUNE);
  }

  public render({ paused, forward, durations }: AutoplayScene): void {
    const { playButton, directionMask, durationFields } = this.shell;

    playButton.src = paused ? this.playIcon : this.pauseIcon;
    playButton.title = paused ? "Resume autoplay" : "Pause autoplay";
    toggleDataset(directionMask, "forward", forward);
    durationFields.image.value = String(toSeconds(durations.image));
    durationFields.minimumVideo.value = String(toSeconds(durations.minimumVideo));
  }

  public showContainer(visible: boolean): void {
    toggleDataset(this.shell.container, "visible", visible);
  }

  public showMenu(visible: boolean): void {
    toggleDataset(this.shell.menu, "visible", visible);
  }

  public holdMenu(held: boolean): void {
    toggleDataset(this.shell.menu, "persistent", held);
  }

  public showSettings(open: boolean): void {
    toggleDataset(this.shell.settingsMenu, "visible", open);
    toggleDataset(this.shell.settingsButton, "open", open);
  }
}
