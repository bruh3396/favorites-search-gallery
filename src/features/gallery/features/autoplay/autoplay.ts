import { AutoplayControl } from "@/features/gallery/features/autoplay/control/control";
import { AutoplayDependencies } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayFlows } from "@/features/gallery/features/autoplay/flows/flows";
import { AutoplayModel } from "@/features/gallery/features/autoplay/model/model";
import { AutoplayShell } from "@/features/gallery/features/autoplay/shell/shell";
import { AutoplayView } from "@/features/gallery/features/autoplay/view/view";
import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { PostMedia } from "@/core/domain/post/post";

export class Autoplay {
  private readonly flows: AutoplayFlows;
  private readonly control: AutoplayControl;

  constructor(dependencies: AutoplayDependencies) {
    const shell = new AutoplayShell(dependencies.platform);

    this.flows = new AutoplayFlows(dependencies, new AutoplayModel(), new AutoplayView(shell, dependencies));
    this.control = new AutoplayControl(shell, this.flows.player, dependencies.platform);
  }

  public mount(container: HTMLElement): void {
    this.flows.player.mount(container);
  }

  public refresh(): void {
    this.flows.player.refresh();
  }

  public openGallery(): void {
    this.flows.player.openGallery();
  }

  public closeGallery(): void {
    this.flows.player.closeGallery();
  }

  public display(item: PostMedia): void {
    this.flows.player.display(item);
  }

  public handleVideoEnded(): void {
    this.flows.player.handleVideoEnded();
  }

  public handleKeyDown(event: EnhancedKeyboardEvent): void {
    this.flows.player.handleKeyDown(event);
  }

  public handleMouseMove(): void {
    this.flows.menu.handleMouseMove();
  }

  public showMenu(): void {
    this.flows.menu.show();
  }
}
