import { insertStyle } from "@/utils/dom/injector";

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
