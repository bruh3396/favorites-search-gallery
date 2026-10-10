import { LightboxStageClass } from "@/core/ui/lightbox/stage/stage_class";
import { Media } from "@/core/domain/media/media";
import { h } from "@/core/ui/h/h";

export class VideoElement {
  private readonly element: HTMLVideoElement;
  private version: number;
  private isActive: boolean;

  constructor(private readonly resolveOriginalUrl: (media: Media) => Promise<string>) {
    this.element = <video className={LightboxStageClass.media} controls preload="auto" hidden onClick={event => this.handleClick(event)} /> as HTMLVideoElement;
    this.element.setAttribute("controlsList", "nofullscreen");
    this.version = 0;
    this.isActive = false;
  }

  public get root(): HTMLVideoElement {
    return this.element;
  }

  public assign(media: Media): void {
    this.version += 1;
    const version = this.version;

    this.resolveOriginalUrl(media)
      .then(url => {
        if (version === this.version) {
          this.element.src = url;

          if (this.isActive) {
            this.play();
          }
        }
      })
      .catch(error => {
        if (version === this.version) {
          console.error(error);
        }
      });
  }

  public release(): void {
    this.isActive = false;
    this.version += 1;
    this.element.pause();
    this.element.hidden = true;

    if (this.element.hasAttribute("src")) {
      this.element.removeAttribute("src");
      this.element.load();
    }
  }

  public activate(): void {
    this.isActive = true;
    this.element.hidden = false;

    if (this.element.hasAttribute("src")) {
      this.play();
    }
  }

  public deactivate(): void {
    this.isActive = false;
    this.element.pause();
    this.element.hidden = true;
  }

  private handleClick(event: MouseEvent): void {
    if (event.ctrlKey) {
      return;
    }
    event.preventDefault();

    if (this.element.paused) {
      this.play();
    } else {
      this.element.pause();
    }
  }

  private play(): void {
    this.element.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error(error);
    });
  }
}
