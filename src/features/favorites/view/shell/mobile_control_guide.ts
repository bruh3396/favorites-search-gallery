import CONTROLS_CSS from "../../../../assets/css/controls.css";
import { insertStyle } from "../../../../lib/dom/injector";
import { sleep } from "../../../../lib/async/sleep";

export async function buildControlsGuide(): Promise<void> {
  insertStyle(CONTROLS_CSS);
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
    controlGuide.classList.toggle("controls-guide--active", true);
  };
  controlGuide.ontouchstart = (event): void => {
    event.preventDefault();
    event.stopPropagation();
    controlGuide.classList.toggle("controls-guide--active", false);
  };
  await sleep(0);
  const helpLinksContainer = document.getElementById("help-links-container");

  if (helpLinksContainer === null) {
    return;
  }
  helpLinksContainer.insertAdjacentElement("afterbegin", anchor);
  controlGuide.onmousedown = (): void => {
    controlGuide.classList.toggle("controls-guide--active", false);
  };
}
