import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../../lib/global/container";
import { HELP_HTML } from "../../../../../assets/html";
import { ON_MOBILE_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";
import { getCurrentThemeClass } from "../../../../../utils/dom/style";

let dialog: HTMLDialogElement;

function insertHelpHTML(): void {
  const parent = document.getElementById(ON_MOBILE_DEVICE ? "mobile-footer-header" : "left-favorites-panel-top-row");

  if (parent !== null) {
    parent.insertAdjacentHTML("beforeend", HELP_HTML);
  }
}

function createWhatsNewMenu(): void {
  const whatsNew = document.getElementById("whats-new-link");

  if (whatsNew === null) {
    return;
  }

  if (ON_MOBILE_DEVICE) {
    whatsNew.remove();
    return;
  }
  createDialogWhatsNewMenu(whatsNew);
}

function createDialogWhatsNewMenu(menu: HTMLElement): void {
  dialog = document.createElement("dialog");
  dialog.id = "whats-new-dialog";
  dialog.style.padding = "5px 10px";
  dialog.style.fontSize = "large";
  dialog.classList.add(getCurrentThemeClass());
  FAVORITES_SEARCH_GALLERY_CONTAINER.appendChild(dialog);
  const whatsNewContainer = menu.querySelector("#whats-new-container");

  if (whatsNewContainer === null) {
    return;
  }
  whatsNewContainer.removeAttribute("id");

  dialog.appendChild(whatsNewContainer);
  const closeButton = document.createElement("button");

  closeButton.textContent = "X";
  closeButton.style.position = "absolute";
  closeButton.style.top = "1em";
  closeButton.style.right = "1em";
  closeButton.addEventListener("click", () => dialog.close());
  dialog.appendChild(closeButton);
  menu.onmousedown = (): boolean => {
    dialog.showModal();
    return false;
  };
  dialog.onclick = (): void => {
    dialog.close();
  };
}

export function createFavoritesHelpMenu(): void {
  insertHelpHTML();
  createWhatsNewMenu();
}
