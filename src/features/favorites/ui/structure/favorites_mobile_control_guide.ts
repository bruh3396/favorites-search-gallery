import { CONTROLS_HTML } from "../../../../assets/html";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/global/container";
import { insertHTMLAndExtractStyle } from "../../../../utils/dom/style";
import { sleep } from "../../../../utils/misc/async";

export async function createControlsGuide(): Promise<void> {
  insertHTMLAndExtractStyle(FAVORITES_SEARCH_GALLERY_CONTAINER, "beforeend", CONTROLS_HTML);
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
