import DESKTOP_SIDEBAR_CSS from "../../assets/css/desktop_sidebar.css";
import DESKTOP_SLIM_CSS from "../../assets/css/desktop_slim.css";
import { insertStyle } from "../dom/injector";
import { yieldControl } from "../async/sleep";

export function toggleAddOrRemoveButtons(value: boolean): void {
  insertStyle(`
        .post-action-btn--remove, .post-action-btn--add {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
    `, "post-action-btn-visibility");
}

export function toggleDownloadButtons(value: boolean): void {
  insertStyle(`
        .post-action-btn--download {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
    `, "post-download-btn-visibility");
}

export function toggleHeader(value: boolean): void {
  insertStyle(`#header {display: ${value ? "block" : "none"}}`, "header");
}

export function toggleMaximizeToggleFavoriteButtons(value: boolean): void {
  const html = `
  .post-action-btn {
    width: 100% !important;
    height: 100% !important;
  }`;

  insertStyle(value ? html : "", "post-action-btn-maximize");
}

export function toggleAlternateLayout(value: boolean): void {
  insertStyle(value ? DESKTOP_SIDEBAR_CSS : "", "fav-layout-alternate");
}

export async function toggleSlimLayout(value: boolean): Promise<void> {
  await yieldControl();
  insertStyle(value ? DESKTOP_SLIM_CSS : "", "fav-layout-slim");
  const status = document.getElementById("favorites-load-status");
  const pagination = document.getElementById("favorites-pagination-container");
  const header = document.getElementById("search-header");

  if (status === null || pagination === null || header === null) {
    return;
  }
  (value ? pagination : header).insertAdjacentElement("afterend", status);
}
