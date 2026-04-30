import { CONTROLS_HTML } from "../../../../assets/html";
import { OVERLAYS } from "../../../../lib/shell";
import { insertHtmlWithStyles } from "../../../../utils/dom/injector";
import { sleep } from "../../../../lib/core/scheduling/promise";

export async function createControlsGuide(): Promise<void> {
  insertHtmlWithStyles(OVERLAYS, "beforeend", CONTROLS_HTML);
  const controlGuide = document.getElementById("controls-guide");

  if (controlGuide === null) {
    return;
  }
  const anchor = document.createElement("a");

  anchor.textContent = "Controls";
  anchor.href = "#";
  anchor.onmousedown = (event): void => {
    event.preventDefault();
    event.stopPropagation();
    controlGuide.classList.toggle("active", true);
  };
  controlGuide.ontouchstart = (event): void => {
    event.preventDefault();
    event.stopPropagation();
    controlGuide.classList.toggle("active", false);
  };
  await sleep(0);
  const helpLinksContainer = document.getElementById("help-links-container");

  if (helpLinksContainer === null) {
    return;
  }
  helpLinksContainer.insertAdjacentElement("afterbegin", anchor);
  controlGuide.onmousedown = (): void => {
    controlGuide.classList.toggle("active", false);
  };
}
