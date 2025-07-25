import { FavoriteLayout, MetadataMetric, NavigationKey, Rating } from "../../../types/primitives/primitives";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "../flags/intrinsic_flags";
import { EventEmitter } from "../../components/event_emitter";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../container";
import { FavoriteItem } from "../../../features/favorites/types/favorite/favorite_item";
import { FavoritesKeyboardEvent } from "../../../types/events/keyboard_event";
import { FavoritesMouseEvent } from "../../../types/events/mouse_event";
import { FavoritesPageRelation } from "../../../features/favorites/types/favorite/favorite_types";
import { FavoritesWheelEvent } from "../../../types/events/wheel_event";
import { GalleryMenuAction } from "../../../features/gallery/types/gallery_types";
import { PerformanceProfile } from "../../../types/primitives/enums";
import { setupSwipeEvents } from "./swipe_events";
import { setupTouchHoldEvents } from "./touch_hold_events";

const container = ON_FAVORITES_PAGE ? FAVORITES_SEARCH_GALLERY_CONTAINER : document.documentElement;

const favorites = {
  searchStarted: new EventEmitter<string>(true),
  searchBoxUpdated: new EventEmitter<void>(true),
  pageChanged: new EventEmitter<void>(true),
  pageSelected: new EventEmitter<number>(true),
  relativePageSelected: new EventEmitter<FavoritesPageRelation>(true),
  findFavoriteStarted: new EventEmitter<string>(true),
  findFavoriteInAllStarted: new EventEmitter<string>(true),
  favoritesLoadedFromDatabase: new EventEmitter<void>(true),
  favoritesLoaded: new EventEmitter<void>(true),
  startedFetchingFavorites: new EventEmitter<void>(true),
  searchResultsUpdated: new EventEmitter<FavoriteItem[]>(true),
  favoriteRemoved: new EventEmitter<string>(true),
  inGalleryRequest: new EventEmitter<void>(true),
  pageChangeResponse: new EventEmitter<void>(true),
  newFavoritesFoundOnReload: new EventEmitter<FavoriteItem[]>(true),
  resultsAddedToCurrentPage: new EventEmitter<HTMLElement[]>(true),
  missingMetadataFound: new EventEmitter<string>(true),
  favoritesResized: new EventEmitter<void>(true),
  captionsReEnabled: new EventEmitter<boolean>(true),
  resultsPerPageChanged: new EventEmitter<number>(true),
  allowedRatingsChanged: new EventEmitter<Rating>(true),
  columnCountChanged: new EventEmitter<number>(true),
  rowSizeChanged: new EventEmitter<number>(true),
  layoutChanged: new EventEmitter<FavoriteLayout>(true),
  sortingMethodChanged: new EventEmitter<MetadataMetric>(true),
  performanceProfileChanged: new EventEmitter<PerformanceProfile>(true),
  showOnHoverToggled: new EventEmitter<boolean>(true),
  tooltipsToggled: new EventEmitter<boolean>(true),
  autoplayToggled: new EventEmitter<boolean>(true),
  hintsToggled: new EventEmitter<boolean>(true),
  optionsToggled: new EventEmitter<boolean>(true),
  removeButtonsToggled: new EventEmitter<boolean>(true),
  addButtonsToggled: new EventEmitter<boolean>(true),
  downloadButtonsToggled: new EventEmitter<boolean>(true),
  uiToggled: new EventEmitter<boolean>(true),
  darkThemeToggled: new EventEmitter<boolean>(true),
  headerToggled: new EventEmitter<boolean>(true),
  captionsToggled: new EventEmitter<boolean>(true),
  sortAscendingToggled: new EventEmitter<boolean>(true),
  galleryMenuToggled: new EventEmitter<boolean>(true),
  blacklistToggled: new EventEmitter<boolean>(true),
  infiniteScrollToggled: new EventEmitter<boolean>(true),
  fancyHoveringToggled: new EventEmitter<boolean>(true),
  savedSearchesToggled: new EventEmitter<boolean>(true),
  downloadButtonClicked: new EventEmitter<MouseEvent>(true),
  searchSubsetClicked: new EventEmitter<MouseEvent>(true),
  stopSearchSubsetClicked: new EventEmitter<MouseEvent>(true),
  invertButtonClicked: new EventEmitter<MouseEvent>(true),
  shuffleButtonClicked: new EventEmitter<MouseEvent>(true),
  searchButtonClicked: new EventEmitter<MouseEvent>(true),
  clearButtonClicked: new EventEmitter<MouseEvent>(true),
  resetButtonClicked: new EventEmitter<MouseEvent>(true),
  resetConfirmed: new EventEmitter<void>(true)
};

const gallery = {
  inGalleryResponse: new EventEmitter<boolean>(true),
  pageChangeRequested: new EventEmitter<NavigationKey>(true),
  favoriteToggled: new EventEmitter<string>(true),
  showOnHoverToggled: new EventEmitter<boolean>(true),
  enteredGallery: new EventEmitter<void>(true),
  exitedGallery: new EventEmitter<void>(true),
  visibleThumbsChanged: new EventEmitter<IntersectionObserverEntry[]>(true),
  galleryMenuButtonClicked: new EventEmitter<GalleryMenuAction>(true),
  videoEnded: new EventEmitter<void>(true),
  videoDoubleClicked: new EventEmitter<MouseEvent>(true),
  rightTap: new EventEmitter<void>(true),
  leftTap: new EventEmitter<void>(true)
};

const caption = {
  idClicked: new EventEmitter<string>(true),
  searchForTag: new EventEmitter<string>(true)
};

const searchBox = {
  appendSearchBox: new EventEmitter<string>(true)
};

const mobile = {
  swipedUp: new EventEmitter<void>(true),
  swipedDown: new EventEmitter<void>(true),
  swipedLeft: new EventEmitter<void>(true),
  swipedRight: new EventEmitter<void>(true),
  touchHold: new EventEmitter<EventTarget>(true)
};

const tagModifier = {
  resetConfirmed: new EventEmitter<void>(true)
};

const document1 = {
  domLoaded: new EventEmitter<void>(true),
  postProcess: new EventEmitter<void>(true),
  mouseover: new EventEmitter<FavoritesMouseEvent>(true),
  click: new EventEmitter<MouseEvent>(true),
  mousedown: new EventEmitter<MouseEvent>(true),
  touchStart: new EventEmitter<TouchEvent>(true),
  touchEnd: new EventEmitter<TouchEvent>(true),
  keydown: new EventEmitter<FavoritesKeyboardEvent>(true),
  keyup: new EventEmitter<FavoritesKeyboardEvent>(true),
  wheel: new EventEmitter<FavoritesWheelEvent>(true),
  contextmenu: new EventEmitter<MouseEvent>(true),
  mousemove: new EventEmitter<MouseEvent>(true)
};

const window1 = {
  focus: new EventEmitter<FocusEvent>(true),
  blur: new EventEmitter<FocusEvent>(true),
  orientationChange: new EventEmitter<Event>(true)
};

function setupDocumentEvents(): void {
  broadcastDOMLoad();
  setupCommonEvents();
}

function setupCommonEvents(): void {
  container.addEventListener("click", (event) => {
    Events.document.click.emit(event);
  });
  container.addEventListener("mousedown", (event) => {
    Events.document.mousedown.emit(event);
  });
  document.addEventListener("keydown", (event) => {
    Events.document.keydown.emit(new FavoritesKeyboardEvent(event));
  });
  document.addEventListener("keyup", (event) => {
    Events.document.keyup.emit(new FavoritesKeyboardEvent(event));
  });
  container.addEventListener("mouseover", (event) => {
    Events.document.mouseover.emit(new FavoritesMouseEvent(event));
  }, {
    passive: true
  });
  container.addEventListener("mousemove", (event) => {
    Events.document.mousemove.emit(event);
  }, {
    passive: true
  });
  document.addEventListener("wheel", (event) => {
    Events.document.wheel.emit(new FavoritesWheelEvent(event));
  }, {
    passive: true
  });
  container.addEventListener("contextmenu", (event) => {
    Events.document.contextmenu.emit(event);
  });
  container.addEventListener("touchstart", (event) => {
    Events.document.touchStart.emit(event);
  }, {passive: false});
  container.addEventListener("touchend", (event) => {
    Events.document.touchEnd.emit(event);
  });
}

function setupWindowEvents(): void {
  window.addEventListener("focus", (event) => {
    window1.focus.emit(event);
  });
  window.addEventListener("blur", (event) => {
    window1.focus.emit(event);
  });
  window.addEventListener("orientationchange", (event) => {
    Events.window.orientationChange.emit(event);
  });
}

function setupMobileEvents(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  setupTouchHoldEvents();
  setupSwipeEvents();
}

function toggleGlobalInputEvents(value: boolean): void {
  for (const event of Object.values(Events.document)) {
    event.toggle(value);
  }
}

function broadcastDOMLoad(): void {
  document.addEventListener("DOMContentLoaded", () => {
    Events.document.domLoaded.emit();
  });
}

export const Events = {
  favorites,
  gallery,
  caption,
  searchBox,
  document: document1,
  window: window1,
  mobile,
  tagModifier,
  toggleGlobalInputEvents
};

export function setupEvents(): void {
  setupDocumentEvents();
  setupWindowEvents();
  setupMobileEvents();
}
