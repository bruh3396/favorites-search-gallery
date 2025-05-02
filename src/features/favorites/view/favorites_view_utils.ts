import {insertStyleHTML} from "../../../utils/dom/style";

export function toggleAddOrRemoveButtons(value: boolean): void {
  insertStyleHTML(`
        .remove-favorite-button, .add-favorite-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "add-or-remove-button-visibility");
  // forceHideCaptions(value);
}

  export function toggleDownloadButtons(value: boolean): void {
    insertStyleHTML(`
        .download-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "download-button-visibility");
    // forceHideCaptions(value);
  }
