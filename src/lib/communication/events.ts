import { Favorite, PageRelation } from "../../types/favorite";
import { GalleryMenuAction, Layout, PerformanceProfile } from "../../types/ui";
import { MetadataMetric, Rating } from "../../types/search";
import { Emitter } from "../core/scheduling/emitter";
import { SearchPage } from "../../features/search_page/types/search_page";
import { StickyEmitter } from "../core/scheduling/sticky_emitter";

export const Events = {
  favorites: {
    searchStarted: new Emitter<string>(),
    pageChanged: new Emitter<void>(),
    pageSelected: new Emitter<number>(),
    relativePageSelected: new Emitter<PageRelation>(),
    findFavoriteStarted: new Emitter<string>(),
    findFavoriteInAllStarted: new Emitter<string>(),
    favoritesFoundInDatabase: new StickyEmitter<boolean>(),
    favoritesLoaded: new StickyEmitter<void>(),

    searchResultsUpdated: new Emitter<void>(),
    favoriteRemoved: new Emitter<string>(),
    newFavoritesFound: new Emitter<Favorite[]>(),
    favoritesAddedToCurrentPage: new Emitter<HTMLElement[]>(),
    resetConfirmed: new Emitter<void>(),

    downloadButtonClicked: new Emitter<MouseEvent>(),
    setActiveFavoritesClicked: new Emitter<MouseEvent>(),
    resetActiveFavoritesClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),
    searchButtonClicked: new Emitter<MouseEvent>(),
    clearButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),

    resultsPerPageChanged: new Emitter<number>(),
    allowedRatingsChanged: new Emitter<Rating>(),
    columnCountChanged: new Emitter<number>(),
    rowSizeChanged: new Emitter<number>(),
    layoutChanged: new Emitter<Layout>(),
    sortingMethodChanged: new Emitter<MetadataMetric>(),
    performanceProfileChanged: new Emitter<PerformanceProfile>(),

    showOnHoverToggled: new Emitter<boolean>(),
    tooltipsToggled: new Emitter<boolean>(),
    autoplayToggled: new Emitter<boolean>(),
    removeButtonsToggled: new Emitter<boolean>(),
    addButtonsToggled: new Emitter<boolean>(),
    alternateLayoutToggled: new Emitter<boolean>(),
    downloadButtonsToggled: new Emitter<boolean>(),
    captionsToggled: new Emitter<boolean>(),
    sortAscendingToggled: new Emitter<boolean>(),
    galleryMenuToggled: new Emitter<boolean>(),
    blacklistToggled: new Emitter<boolean>(),
    infiniteScrollToggled: new Emitter<boolean>()
  },
  gallery: {
    favoriteToggled: new Emitter<string>(),
    showOnHoverOverridden: new Emitter<boolean>(),
    openedGallery: new Emitter<HTMLElement>(),
    closedGallery: new Emitter<void>(),
    presentedThumb: new Emitter<HTMLElement>(),
    visibleThumbsChanged: new Emitter<void>(),
    galleryMenuButtonClicked: new Emitter<GalleryMenuAction>(),
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
    layoutChanged: new Emitter<Layout>(),
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
  }
};
