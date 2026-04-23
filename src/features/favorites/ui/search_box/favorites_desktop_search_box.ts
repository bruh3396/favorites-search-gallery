import { Preferences } from "../../../../lib/global/preferences/preferences";

export function createDesktopSearchBar(id: string, parentId: string, initialValue?: string): HTMLTextAreaElement {
  const searchBox = document.createElement("textarea");

  searchBox.id = id;
  searchBox.placeholder = "Search Favorites";
  searchBox.spellcheck = false;
  searchBox.value = initialValue ?? "";

  const parent = document.getElementById(parentId);

  if (parent !== null) {
    parent.insertAdjacentElement("beforeend", searchBox);
  }
  searchBox.style.height = `${Preferences.desktopSearchBoxHeight.value}px`;

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];

    if (searchBox === undefined) {
      return;
    }
    const newHeight = entry.contentRect.height;

    if (Preferences.desktopSearchBoxHeight.value !== newHeight) {
      Preferences.desktopSearchBoxHeight.set(newHeight);
    }
  });

  observer.observe(searchBox);
  return searchBox;
}
