import { select, unselectAll } from "@/features/favorites/features/tag_modifier/selection";
import { Favorite } from "@/types/favorite";
import { ITEM_CLASS_NAME } from "@/lib/thumb/thumbs";
import { insertStyle } from "@/utils/dom/injector";

let getFavorite: (id: string) => Favorite | undefined = () => undefined;
let toggleUi: (value: boolean) => void = () => {};
let tagEditModeEnabled = false;
let tagEditModeAbortController = new AbortController();

export function initializeTagEditMode(getFav: (id: string) => Favorite | undefined, onToggleUi: (value: boolean) => void): void {
  getFavorite = getFav;
  toggleUi = onToggleUi;
}

export function toggleTagEditMode(value: boolean): void {
  tagEditModeEnabled = value;
  toggleThumbInteraction(value);
  toggleUi(value);
  toggleTagEditModeAbortController(value);
  unselectAll();
}

export function handleDocumentClick(event: MouseEvent): void {
  if (!tagEditModeEnabled) {
    return;
  }

  if (!(event.target instanceof HTMLElement) || !event.target.classList.contains(ITEM_CLASS_NAME)) {
    return;
  }
  const favorite = getFavorite(event.target.id);

  if (favorite !== undefined) {
    select(favorite);
  }
}

function toggleThumbInteraction(value: boolean): void {
  let html = "";

  if (value) {
    html =
      `
      .post  {
        cursor: pointer;
        outline: 1px solid black;

        > div,
        >a
        {
          outline: none !important;

          > img {
            outline: none !important;
          }

          pointer-events:none;
          opacity: 0.6;
          filter: grayscale(40%);
          transition: none !important;
        }
      }
    `;
  }
  insertStyle(html, "tag-modifier-edit-mode");
}

function toggleTagEditModeAbortController(value: boolean): void {
  if (!value) {
    tagEditModeAbortController.abort();
    tagEditModeAbortController = new AbortController();
  }
}
