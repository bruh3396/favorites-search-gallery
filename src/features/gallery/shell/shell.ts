import { GalleryClass, GalleryId } from "@/features/gallery/types/selectors";
import { createElement, div } from "@/utils/browser/element";
import { Shell } from "@/app/context/shell";

export class GalleryShell {
  public readonly root: HTMLElement;
  public readonly background: HTMLElement;
  public readonly menu: HTMLElement;
  public readonly menuButtons: HTMLElement;
  public readonly tutorial: HTMLElement;

  constructor(shell: Shell) {
    this.root = div(GalleryId.root);
    this.background = div(GalleryId.background);
    this.menu = div(GalleryId.menu);
    this.menuButtons = div(GalleryId.menuButtons);
    this.tutorial = createElement("div", { id: GalleryId.tutorial, dataset: { hidden: "" } });
    this.menu.className = GalleryClass.subMenu;
    this.menu.append(this.menuButtons);
    this.root.append(this.background, this.menu);
    shell.overlays.append(this.root, this.tutorial);
  }
}
