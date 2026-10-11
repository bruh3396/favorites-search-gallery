export class BrowserHostPage {
  public claimContent(): HTMLElement {
    this.overlayScrollbar();
    return document.body.appendChild(document.createElement("div"));
  }

  private overlayScrollbar(): void {
    document.documentElement.style.width = "100vw";
    document.body.style.overflowX = "clip";
  }
}
