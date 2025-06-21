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
  return searchBox;
}
