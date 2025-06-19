import { HELP_HTML } from "../../../../../assets/html";
import { ON_MOBILE_DEVICE } from "../../../../../lib/globals/flags";

function insertHelpHTML(): void {
  const parent = document.getElementById(ON_MOBILE_DEVICE ? "mobile-footer-header" : "left-favorites-panel-top-row");

  if (parent !== null) {
    parent.insertAdjacentHTML("beforeend", HELP_HTML);
  }
}

function addEventListenersToWhatsNewMenu(): void {
  const whatsNew = document.getElementById("whats-new-link");

  if (whatsNew === null) {
    return;
  }

  if (ON_MOBILE_DEVICE) {
    whatsNew.remove();
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
