import { EnhancedKeyboardEvent, EnhancedMouseEvent, EnhancedWheelEvent } from "../../types/input_types";
import { Favorite, FavoritesPageRelation } from "../../types/favorite_data_types";
import { GalleryMenuAction, LayoutMode, MetadataMetric, PerformanceProfile, Rating } from "../../types/common_types";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "../environment/environment";
import { Emitter } from "./emitter";
import { ROOT } from "../shell";
import { SearchPage } from "../../types/search_page";
import { setupSwipeEvents } from "./swipe_events";
import { setupTouchHoldEvents } from "./touch_hold_events";

const CONTAINER = ON_FAVORITES_PAGE ? ROOT : document.documentElement;

export const Events = {
  favorites: {
    searchStarted: new Emitter<string>(),
    searchBoxUpdated: new Emitter<void>(),
    pageChanged: new Emitter<void>(),
    pageSelected: new Emitter<number>(),
    relativePageSelected: new Emitter<FavoritesPageRelation>(),
    findFavoriteStarted: new Emitter<string>(),
    findFavoriteInAllStarted: new Emitter<string>(),
    favoritesLoadedFromDatabase: new Emitter<void>(),
    favoritesLoaded: new Emitter<void>(),
    startedStoringAllFavorites: new Emitter<void>(),
    startedFetchingFavorites: new Emitter<void>(),
    searchResultsUpdated: new Emitter<void>(),
    favoriteRemoved: new Emitter<string>(),
    newFavoritesFoundOnReload: new Emitter<Favorite[]>(),
    favoritesAddedToCurrentPage: new Emitter<HTMLElement[]>(),
    missingMetadataFound: new Emitter<string>(),
    resultsPerPageChanged: new Emitter<number>(),
    allowedRatingsChanged: new Emitter<Rating>(),
    columnCountChanged: new Emitter<number>(),
    rowSizeChanged: new Emitter<number>(),
    layoutChanged: new Emitter<LayoutMode>(),
    sortingMethodChanged: new Emitter<MetadataMetric>(),
    performanceProfileChanged: new Emitter<PerformanceProfile>(),
    showOnHoverToggled: new Emitter<boolean>(),
    tooltipsToggled: new Emitter<boolean>(),
    autoplayToggled: new Emitter<boolean>(),
    hintsToggled: new Emitter<boolean>(),
    optionsToggled: new Emitter<boolean>(),
    removeButtonsToggled: new Emitter<boolean>(),
    addButtonsToggled: new Emitter<boolean>(),
    alternateLayoutToggled: new Emitter<boolean>(),
    downloadButtonsToggled: new Emitter<boolean>(),
    uiToggled: new Emitter<boolean>(),
    darkThemeToggled: new Emitter<boolean>(),
    headerToggled: new Emitter<boolean>(),
    captionsToggled: new Emitter<boolean>(),
    sortAscendingToggled: new Emitter<boolean>(),
    galleryMenuToggled: new Emitter<boolean>(),
    blacklistToggled: new Emitter<boolean>(),
    infiniteScrollToggled: new Emitter<boolean>(),
    downloadButtonClicked: new Emitter<MouseEvent>(),
    searchSubsetClicked: new Emitter<MouseEvent>(),
    stopSearchSubsetClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),
    searchButtonClicked: new Emitter<MouseEvent>(),
    clearButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),
    resetConfirmed: new Emitter<void>()
  },
  gallery: {
    favoriteToggled: new Emitter<string>(),
    showOnHoverToggled: new Emitter<boolean>(),
    enteredGallery: new Emitter<void>(),
    exitedGallery: new Emitter<void>(),
    visibleThumbsChanged: new Emitter<void>(),
    galleryMenuButtonClicked: new Emitter<GalleryMenuAction>(),
    videoEnded: new Emitter<void>(),
    videoDoubleClicked: new Emitter<MouseEvent>(),
    rightTap: new Emitter<void>(),
    leftTap: new Emitter<void>(),
    interactionStopped: new Emitter<void>()
  },
  caption: {
    idClicked: new Emitter<string>(),
    searchForTag: new Emitter<string>()
  },
  searchBox: {
    append: new Emitter<string>()
  },
  searchPage: {
    searchPageReady: new Emitter<void>(),
    layoutChanged: new Emitter<LayoutMode>(),
    searchPageCreated: new Emitter<SearchPage>(),
    upscaleToggled: new Emitter<boolean>(),
    infiniteScrollToggled: new Emitter<boolean>(),
    moreResultsAdded: new Emitter<HTMLElement[]>(),
    pageChanged: new Emitter<SearchPage>()
  },
  mobile: {
    swipedUp: new Emitter<void>(),
    swipedDown: new Emitter<void>(),
    swipedLeft: new Emitter<void>(),
    swipedRight: new Emitter<void>(),
    touchHold: new Emitter<TouchEvent>()
  },
  tagModifier: {
    resetConfirmed: new Emitter<void>()
  },
  document: {
    domLoaded: new Emitter<void>(),
    postProcess: new Emitter<void>(),
    mouseover: new Emitter<EnhancedMouseEvent>(),
    click: new Emitter<MouseEvent>(),
    mousedown: new Emitter<MouseEvent>(),
    touchStart: new Emitter<TouchEvent>(),
    touchEnd: new Emitter<TouchEvent>(),
    keydown: new Emitter<EnhancedKeyboardEvent>(),
    keyup: new Emitter<EnhancedKeyboardEvent>(),
    wheel: new Emitter<EnhancedWheelEvent>(),
    contextmenu: new Emitter<MouseEvent>(),
    mousemove: new Emitter<MouseEvent>()
  },
  window: {
    focus: new Emitter<FocusEvent>(),
    blur: new Emitter<FocusEvent>(),
    orientationChange: new Emitter<Event>()
  },

  toggleGlobalInputEvents(value: boolean): void {
    for (const event of Object.values(this.document)) {
      event.toggle(value);
    }
  }
};

function setupDocumentEvents(): void {
  CONTAINER.addEventListener("click", (event) => {
    Events.document.click.emit(event);
  });
  CONTAINER.addEventListener("mousedown", (event) => {
    Events.document.mousedown.emit(event);
  });
  document.addEventListener("keydown", (event) => {
    Events.document.keydown.emit(new EnhancedKeyboardEvent(event));
  });
  document.addEventListener("keyup", (event) => {
    Events.document.keyup.emit(new EnhancedKeyboardEvent(event));
  });
  CONTAINER.addEventListener("mouseover", (event) => {
    Events.document.mouseover.emit(new EnhancedMouseEvent(event));
  }, { passive: true });
  CONTAINER.addEventListener("mousemove", (event) => {
    Events.document.mousemove.emit(event);
  }, { passive: true });
  document.addEventListener("wheel", (event) => {
    Events.document.wheel.emit(new EnhancedWheelEvent(event));
  }, { passive: true });
  CONTAINER.addEventListener("contextmenu", (event) => {
    Events.document.contextmenu.emit(event);
  });
  CONTAINER.addEventListener("touchstart", (event) => {
    Events.document.touchStart.emit(event);
  }, { passive: false });
  CONTAINER.addEventListener("touchend", (event) => {
    Events.document.touchEnd.emit(event);
  });
}

function setupWindowEvents(): void {
  window.addEventListener("focus", (event) => {
    Events.window.focus.emit(event);
  });
  window.addEventListener("blur", (event) => {
    Events.window.blur.emit(event);
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

function broadcastDOMLoad(): void {
  document.addEventListener("DOMContentLoaded", () => {
    Events.document.domLoaded.emit();
  }, { once: true });
}

export function setupEvents(): void {
  broadcastDOMLoad();
  setupDocumentEvents();
  setupWindowEvents();
  setupMobileEvents();
}
