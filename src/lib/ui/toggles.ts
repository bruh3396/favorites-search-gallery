import { DESKTOP_SIDEBAR_CSS, DESKTOP_SLIM_CSS } from "../../assets/css";
import { insertStyle } from "../../utils/dom/injector";
import { yield1 } from "../core/async/promise";

export function toggleAddOrRemoveButtons(value: boolean): void {
  insertStyle(`
        .remove-favorite-button, .add-favorite-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
    `, "add-or-remove-button-visibility");
}

export function toggleDownloadButtons(value: boolean): void {
  insertStyle(`
        .download-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
    `, "download-button-visibility");
}

export function toggleHeader(value: boolean): void {
  insertStyle(`#header {display: ${value ? "block" : "none"}}`, "header");
}

export function toggleMaximizeToggleFavoriteButtons(value: boolean): void {
  const html = `
  .utility-button {
    width: 100% !important;
    height: 100% !important;
  }`;

  insertStyle(value ? html : "", "maximize-toggle-favorite-buttons");
}

export function toggleAlternateLayout(value: boolean): void {
  insertStyle(value ? DESKTOP_SIDEBAR_CSS : "", "alternate-layout");
}

export async function toggleSlimLayout(value: boolean): Promise<void> {
  await yield1();
  insertStyle(value ? DESKTOP_SLIM_CSS : "", "slim-layout");
  const status = document.getElementById("favorites-load-status");
  const pagination = document.getElementById("favorites-pagination-container");
  const header = document.getElementById("search-header");

  if (status === null || pagination === null || header === null) {
    return;
  }
  (value ? pagination : header).insertAdjacentElement("afterend", status);
}
