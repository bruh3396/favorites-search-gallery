import { EnhancedKeyboardEvent, EnhancedMouseEvent, EnhancedWheelEvent } from "../dom/input_types";
import { Favorite, FavoritesPageRelation } from "../../types/favorite";
import { GalleryMenuAction, LayoutMode, PerformanceProfile } from "../../types/ui";
import { MetadataMetric, Rating } from "../../types/search";
import { Emitter } from "../core/scheduling/emitter";
import { SearchPage } from "../../features/search_page/model/search_page";
import { StickyEmitter } from "../core/scheduling/sticky_emitter";

export const Events = {
  favorites: {
    searchStarted: new Emitter<string>(),
    pageChanged: new Emitter<void>(),
    pageSelected: new Emitter<number>(),
    relativePageSelected: new Emitter<FavoritesPageRelation>(),
    findFavoriteStarted: new Emitter<string>(),
    findFavoriteInAllStarted: new Emitter<string>(),
    favoritesLoadedFromDatabase: new StickyEmitter<void>(),
    favoritesLoaded: new StickyEmitter<void>(),

    startedFetchingFavorites: new Emitter<void>(),
    searchResultsUpdated: new Emitter<void>(),
    favoriteRemoved: new Emitter<string>(),
    newFavoritesFound: new Emitter<Favorite[]>(),
    favoritesAddedToCurrentPage: new Emitter<HTMLElement[]>(),

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
    setActiveFavoritesClicked: new Emitter<MouseEvent>(),
    resetActiveFavoritesClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),
    searchButtonClicked: new Emitter<MouseEvent>(),
    clearButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),
    resetConfirmed: new Emitter<void>()
  },
  gallery: {
    favoriteToggled: new Emitter<string>(),
    showOnHoverOverridden: new Emitter<boolean>(),
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
    searchPageReady: new StickyEmitter<void>(),
    layoutChanged: new Emitter<LayoutMode>(),
    searchPageCreated: new StickyEmitter<SearchPage>(),
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
    domLoaded: new StickyEmitter<void>(),
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
  }
};
