import { ALTERNATE_LAYOUT_HTML, SLIM_DESKTOP_HTML } from "../../assets/html";
import { insertStyleHTML } from "./style";
import { yield1 } from "../misc/async";

export function toggleAddOrRemoveButtons(value: boolean): void {
  insertStyleHTML(`
        .remove-favorite-button, .add-favorite-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
    `, "add-or-remove-button-visibility");
}

export function toggleDownloadButtons(value: boolean): void {
  insertStyleHTML(`
        .download-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
    `, "download-button-visibility");
}

export function toggleHeader(value: boolean): void {
  insertStyleHTML(`#header {display: ${value ? "block" : "none"}}`, "header");
}

export function toggleMaximizeToggleFavoriteButtons(value: boolean): void {
  const html = `
  .utility-button {
    width: 100% !important;
    height: 100% !important;
  }`;

  insertStyleHTML(value ? html : "", "maximize-toggle-favorite-buttons");
}

export function toggleAlternateLayout(value: boolean): void {
  insertStyleHTML(value ? ALTERNATE_LAYOUT_HTML : "", "alternate-layout");
}

export async function toggleSlimLayout(value: boolean): Promise<void> {
  await yield1();
  insertStyleHTML(value ? SLIM_DESKTOP_HTML : "", "slim-layout");
  const status = document.getElementById("favorites-load-status");
  const pagination = document.getElementById("favorites-pagination-container");
  const header = document.getElementById("search-header");

  if (status === null || pagination === null || header === null) {
    return;
  }
  (value ? pagination : header).insertAdjacentElement("afterend", status);
}
