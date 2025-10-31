import { insertStyleHTML } from "./style";

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
