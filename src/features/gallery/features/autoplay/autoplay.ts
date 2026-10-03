import { AutoplayConfiguration, AutoplayDependencies } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayControl } from "@/features/gallery/features/autoplay/control/control";
import { AutoplayFlows } from "@/features/gallery/features/autoplay/flows/flows";
import { AutoplayModel } from "@/features/gallery/features/autoplay/model/model";
import { AutoplayShell } from "@/features/gallery/features/autoplay/shell/shell";
import { AutoplayView } from "@/features/gallery/features/autoplay/view/view";
import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { PostMedia } from "@/core/domain/post/post";

export class Autoplay {
  private readonly flows: AutoplayFlows;
  private readonly control: AutoplayControl;

  constructor(configuration: AutoplayConfiguration, dependencies: AutoplayDependencies) {
    const shell = new AutoplayShell(configuration.platform);
    const view = new AutoplayView(shell, dependencies);

    this.flows = new AutoplayFlows(configuration, { context: dependencies, model: new AutoplayModel(), view });
    this.control = new AutoplayControl(configuration, { shell, intents: this.flows.player });
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
