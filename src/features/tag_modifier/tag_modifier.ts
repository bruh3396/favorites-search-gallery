import { TAG_MODIFIER_HTML } from "../../assets/html";
import { ON_FAVORITES_PAGE, ON_POST_PAGE, ON_SEARCH_PAGE, TAG_MODIFIER_DISABLED } from "../../lib/globals/flags";
import { Database } from "../../store/indexed_db/database";
import { Favorite } from "../../types/interfaces/interfaces";
import { TagModificationDatabaseRecord } from "../../types/primitives/composites";
import { insertHTMLAndExtractStyle } from "../../utils/dom/style";

type TagModifierUI = {
  container: HTMLElement
  textarea: HTMLTextAreaElement
  statusLabel: HTMLLabelElement
  add: HTMLButtonElement
  remove: HTMLButtonElement
  reset: HTMLButtonElement
  selectAll: HTMLButtonElement
  unSelectAll: HTMLButtonElement
  import: HTMLButtonElement
  export: HTMLButtonElement
}

const databaseName = "AdditionalTags";
const objectStoreName = "additionalTags";
const tagModifications: Map<string, string> = new Map();
const database = new Database<TagModificationDatabaseRecord>(databaseName, objectStoreName, 12);

let tagEditModeAbortController: AbortController;
/** @type {{container: HTMLElement, checkbox: HTMLInputElement}} */
let favoritesOption: { container: HTMLElement, checkbox: HTMLInputElement };
let favoritesUI: TagModifierUI;
let currentSearchResults: Favorite[];
let atLeastOneFavoriteIsSelected: boolean;

function currentlyModifyingTags(): boolean {
  return document.getElementById("tag-edit-mode") !== null;
}

function getDatabaseRecords(): TagModificationDatabaseRecord[] {
  return Array.from(tagModifications.entries())
    .map((entry) => ({
      id: entry[0],
      tags: entry[1]
    }));
}

function storeTagModifications() {
  database.store(getDatabaseRecords());
}

async function loadTagModifications() {
  const records = await database.load();

  for (const record of records) {
    tagModifications.set(record.id, record.tags);
  }
}

export function setupTagModifier() {
  if (TAG_MODIFIER_DISABLED) {
    return;
  }
  loadTagModifications()

  tagEditModeAbortController = new AbortController();
  favoritesOption = {} as { container: HTMLDivElement, checkbox: HTMLInputElement };
  favoritesUI = {} as TagModifierUI;
  currentSearchResults = [];
  atLeastOneFavoriteIsSelected = false;
  insertHTML();
  addEventListeners();
}




function insertHTML(): void {
  insertFavoritesPageHTML();
  insertSearchPageHTML();
  insertPostPageHTML();
}

function insertFavoritesPageHTML(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  insertHTMLAndExtractStyle(document.getElementById("bottom-panel-4") as HTMLElement, "beforeend", TAG_MODIFIER_HTML);
  favoritesOption.container = document.getElementById("tag-modifier-container") as HTMLElement;
  favoritesOption.checkbox = document.getElementById("tag-modifier-option-checkbox") as HTMLInputElement;
  favoritesUI.container = document.getElementById("tag-modifier-ui-container") as HTMLElement;
  favoritesUI.statusLabel = document.getElementById("tag-modifier-ui-status-label") as HTMLLabelElement;
  favoritesUI.textarea = document.getElementById("tag-modifier-ui-textarea") as HTMLTextAreaElement;
  favoritesUI.add = document.getElementById("tag-modifier-ui-add") as HTMLButtonElement;
  favoritesUI.remove = document.getElementById("tag-modifier-remove")as HTMLButtonElement ;
  favoritesUI.reset = document.getElementById("tag-modifier-reset") as HTMLButtonElement;
  favoritesUI.selectAll = document.getElementById("tag-modifier-ui-select-all") as HTMLButtonElement;
  favoritesUI.unSelectAll = document.getElementById("tag-modifier-ui-un-select-all") as HTMLButtonElement;
  favoritesUI.import = document.getElementById("tag-modifier-import") as HTMLButtonElement;
  favoritesUI.export = document.getElementById("tag-modifier-export") as HTMLButtonElement;
}

function insertSearchPageHTML(): void {
  // if (!ON_SEARCH_PAGE) {
  //   return;
  // }
}

function insertPostPageHTML(): void {
  if (!ON_POST_PAGE) {
    return;
  }
  const contentContainer = document.querySelector(".flexi");
  const originalAddToFavoritesLink = Array.from(document.querySelectorAll("a")).find(a => a.textContent === "Add to favorites");

  const html = `
      <div style="margin-bottom: 1em;">
        <h4 class="image-sublinks">
        <a href="#" id="add-to-favorites">Add to favorites</a>
        |
        <a href="#" id="add-custom-tags">Add custom tag</a>
        <select id="custom-tags-list"></select>
        </h4>
      </div>
    `;

  if (contentContainer === null || originalAddToFavoritesLink === undefined) {
    return;
  }
  contentContainer.insertAdjacentHTML("beforebegin", html);

  const addToFavorites = document.getElementById("add-to-favorites");
  const addCustomTags = document.getElementById("add-custom-tags");
  const customTagsList = document.getElementById("custom-tags-list");

  for (const customTag of Utils.customTags.values()) {
    const option = document.createElement("option");

    option.value = customTag;
    option.textContent = customTag;
    customTagsList.appendChild(option);
  }
  addToFavorites.onclick = () => {
    originalAddToFavoritesLink.click();
    return false;
  };

  addCustomTags.onclick = () => {
    return false;
  };
}

addEventListeners() {
  addFavoritesPageEventListeners();
  addSearchPageEventListeners();
  addPostPageEventListeners();
}

addFavoritesPageEventListeners() {
  if (!Flags.onFavoritesPage) {
    return;
  }
  favoritesOption.checkbox.onchange = (event) => {
    toggleTagEditMode(event.target.checked);
  };
  favoritesUI.selectAll.onclick = selectAll.bind(this);
  favoritesUI.unSelectAll.onclick = unSelectAll.bind(this);
  favoritesUI.add.onclick = addTagsToSelected.bind(this);
  favoritesUI.remove.onclick = removeTagsFromSelected.bind(this);
  favoritesUI.reset.onclick = resetTagModifications.bind(this);
  favoritesUI.import.onclick = importTagModifications.bind(this);
  favoritesUI.export.onclick = exportTagModifications.bind(this);
  Events.favorites.searchResultsUpdated.on(() => {
    unSelectAll();
  });
  Events.favorites.pageChanged.on(() => {
    highlightSelectedThumbsOnPageChange();
  });
}

addSearchPageEventListeners() {
  if (!Flags.onSearchPage) {
    return;
  }
  1;
}

addPostPageEventListeners() {
  if (!Flags.onPostPage) {
    return;
  }
  1;
}

highlightSelectedThumbsOnPageChange() {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }
  const posts = Utils.getAllThumbs()
    .map(thumb => Post.get(thumb.id));

  for (const post of posts) {
    if (post === undefined) {
      return;
    }

    if (isSelectedForModification(post)) {
      highlightPost(post, true);
    }
  }
}

/**
 * @param {Boolean} value
 */
toggleTagEditMode(value) {
  toggleThumbInteraction(value);
  toggleUI(value);
  toggleTagEditModeEventListeners(value);
  favoritesUI.unSelectAll.click();
}

/**
 * @param {Boolean} value
 */
toggleThumbInteraction(value) {
  let html = "";

  if (value) {
    html =
      `
      .favorite  {
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
  Utils.insertStyleHTML(html, "tag-edit-mode");
}

/**
 * @param {Boolean} value
 */
toggleUI(value) {
  favoritesUI.container.style.display = value ? "block" : "none";
}

/**
 * @param {Boolean} value
 */
toggleTagEditModeEventListeners(value) {
  if (!value) {
    tagEditModeAbortController.abort();
    tagEditModeAbortController = new AbortController();
    return;
  }

  Events.global.click.on((event) => {
    if (!(event.target instanceof HTMLElement) || !event.target.classList.contains(Utils.favoriteItemClassName)) {
      return;
    }
    const post = Post.get(event.target.id);

    if (post !== undefined) {
      toggleThumbSelection(post);
    }
  }, {
    signal: tagEditModeAbortController.signal
  });
}

/**
 * @param {String} text
 */
showStatus(text) {
  favoritesUI.statusLabel.style.visibility = "visible";
  favoritesUI.statusLabel.textContent = text;
  setTimeout(() => {
    const statusHasNotChanged = favoritesUI.statusLabel.textContent === text;

    if (statusHasNotChanged) {
      favoritesUI.statusLabel.style.visibility = "hidden";
    }
  }, 1000);
}

unSelectAll() {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }

  for (const post of Post.all()) {
    toggleThumbSelection(post, false);
  }
  atLeastOneFavoriteIsSelected = false;
}

selectAll() {
  for (const post of FavoritesSearchResultObserver.latestSearchResults) {
    toggleThumbSelection(post, true);
  }
}

/**
 * @param {Post} post
 * @param {Boolean | undefined} value
 */
toggleThumbSelection(post, value = undefined) {
  atLeastOneFavoriteIsSelected = true;

  if (value === undefined) {
    value = !isSelectedForModification(post);
  }
  post.selectedForTagModification = value ? true : undefined;
  highlightPost(post, value);
}

/**
 * @param {Post} post
 * @param {Boolean} value
 */
highlightPost(post, value) {
  if (post.root !== undefined) {
    post.root.classList.toggle("tag-modifier-selected", value);
  }
}

/**
 * @param {Post} post
 * @returns {Boolean}
 */
isSelectedForModification(post) {
  return post.selectedForTagModification !== undefined;
}

/**
 * @param {String} tags
 * @returns
 */
removeContentTypeTags(tags) {
  return tags
    .replace(/(?:^|\s*)(?:video|animated|mp4)(?:$|\s*)/g, "");
}

addTagsToSelected() {
  modifyTagsOfSelected(false);
}

removeTagsFromSelected() {
  modifyTagsOfSelected(true);
}

/**
 * @param {Boolean} remove
 */
modifyTagsOfSelected(remove) {
  const tags = favoritesUI.textarea.value.toLowerCase();
  const tagsWithoutContentTypes = removeContentTypeTags(tags);
  const tagsToModify = Utils.removeExtraWhiteSpace(tagsWithoutContentTypes);
  const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
  let modifiedTagsCount = 0;

  if (tagsToModify === "") {
    return;
  }

  for (const post of Post.all()) {
    if (isSelectedForModification(post)) {
      const additionalTags = remove ? post.tags.removeAdditionalTags(tagsToModify) : post.tags.addAdditionalTags(tagsToModify);

      TagModifier.tagModifications.set(post.id, additionalTags);
      modifiedTagsCount += 1;
    }
  }

  if (modifiedTagsCount === 0) {
    return;
  }

  if (tags !== tagsWithoutContentTypes) {
    alert("Warning: video, animated, and mp4 tags are unchanged.\nThey cannot be modified.");
  }
  showStatus(`${statusPrefix} ${modifiedTagsCount} favorite(s)`);
  dispatchEvent(new Event("modifiedTags"));
  Utils.setCustomTags(tagsToModify);
  TagModifier.storeTagModifications();
}

restoreMissingCustomTags() {
  // const allCustomTags = Array.from(TagModifier.tagModifications.values()).join(" ");
  // const allUniqueCustomTags = new Set(allCustomTags.split(" "));

  // Utils.setCustomTags(Array.from(allUniqueCustomTags).join(" "));
}

resetTagModifications() {
  if (!confirm("Are you sure you want to delete all tag modifications?")) {
    return;
  }
  Utils.customTags.clear();
  indexedDB.deleteDatabase("AdditionalTags");
  Post.all().forEach(post => {
    post.tags.resetAdditionalTags();
  });
  dispatchEvent(new Event("modifiedTags"));
  localStorage.removeItem("customTags");
}

exportTagModifications() {
  const modifications = JSON.stringify(Utils.mapToObject(TagModifier.tagModifications));

  navigator.clipboard.writeText(modifications);
  alert("Copied tag modifications to clipboard");
}

importTagModifications() {
  let modifications;

  try {
    const object = JSON.parse(favoritesUI.textarea.value);

    if (!(typeof object === "object")) {
      throw new TypeError(`Input parsed as ${typeof (object)}, but expected object`);
    }
    modifications = Utils.objectToMap(object);
  } catch (error) {
    if (error.name === "SyntaxError" || error.name === "TypeError") {
      alert("Import Unsuccessful. Failed to parse input, JSON object format expected.");
    } else {
      throw error;
    }
    return;
  }
  console.error(modifications);
}