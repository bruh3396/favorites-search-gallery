import { HELP_HTML } from "../../../../../assets/html";
import { ON_MOBILE_DEVICE } from "../../../../../lib/globals/flags";

function insertHelpHTML(): void {
  const parent = document.querySelector("#left-favorites-panel-top-row");

  if (parent !== null) {
    parent.insertAdjacentHTML("beforeend", HELP_HTML);
  }
}

function addEventListenersToWhatsNewMenu(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  const whatsNew = document.getElementById("whats-new-link");

  if (whatsNew === null) {
    return;
  }
  whatsNew.onclick = (): boolean => {
    if (whatsNew.classList.contains("persistent")) {
      whatsNew.classList.remove("persistent");
      whatsNew.classList.add("hidden");
    } else {
      whatsNew.classList.add("persistent");
    }
    return false;
  };

  whatsNew.onblur = (): void => {
    whatsNew.classList.remove("persistent");
    whatsNew.classList.add("hidden");
  };

  whatsNew.onmouseenter = (): void => {
    whatsNew.classList.remove("hidden");
  };

  whatsNew.onmouseleave = (): void => {
    whatsNew.classList.add("hidden");
  };
}

export function createFavoritesHelpMenu(): void {
  insertHelpHTML();
  addEventListenersToWhatsNewMenu();
}
