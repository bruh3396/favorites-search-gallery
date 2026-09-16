import { Shell } from "@/app/context/shell";

export class GalleryShell {
  public readonly root: HTMLElement;
  private readonly shell: Shell;

  constructor(shell: Shell) {
    this.shell = shell;
    this.root = document.createElement("div");
    this.root.id = "gallery-container";
  }

  public mountGallery(): void {
    this.shell.overlays.insertAdjacentElement("beforeend", this.root);
  }
}
