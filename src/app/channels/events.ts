import { Favorite } from "@/types/favorite";
import { FavoriteIndicatorStyle, GalleryMenuAction, Layout, PerformanceProfile } from "@/types/ui";
import { MetadataMetric, Rating, TagCategoryMap } from "@/types/search";
import { Emitter } from "@/lib/communication/emitter";
import { NavigationKey } from "@/types/input";
import { SearchPage } from "@/features/search_page/types/search_page";
import { StickyEmitter } from "@/lib/communication/sticky_emitter";

export const Events = {
  favorites: {
    searchStarted: new Emitter<string>(),
    pageChanged: new Emitter<void>(),
    pageSelected: new Emitter<number>(),
    pageStepped: new Emitter<NavigationKey>(),
    findFavorite: new Emitter<string>(),
    findFavoriteInAll: new Emitter<string>(),
    firstPageFavorites: new StickyEmitter<HTMLElement[] | undefined>(),
    favoritesFoundInDatabase: new StickyEmitter<boolean>(),
    favoritesDatabaseLoaded: new StickyEmitter<void>(),
    favoritesLoaded: new StickyEmitter<void>(),

    searchResultsUpdated: new Emitter<void>(),
    tagCategoriesResolved: new Emitter<TagCategoryMap>(),
    favoriteAdded: new Emitter<string>(),
    favoriteRemoved: new Emitter<string>(),
    newFavoritesFound: new Emitter<Favorite[]>(),
    favoritesAddedToCurrentPage: new Emitter<HTMLElement[]>(),
    resetConfirmed: new Emitter<void>(),

    setActiveFavoritesClicked: new Emitter<MouseEvent>(),
    resetActiveFavoritesClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),
    searchButtonClicked: new Emitter<MouseEvent>(),
    clearButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),
    panelButtonClicked: new Emitter<MouseEvent>(),

    resultsPerPageChanged: new Emitter<number>(),
    allowedRatingsChanged: new Emitter<Rating>(),
    columnCountChanged: new Emitter<number>(),
    rowHeightChanged: new Emitter<number>(),
    layoutChanged: new Emitter<Layout>(),
    sortingMethodChanged: new Emitter<MetadataMetric>(),
    performanceProfileChanged: new Emitter<PerformanceProfile>(),

    galleryPreviewToggled: new Emitter<boolean>(),
    tooltipToggled: new Emitter<boolean>(),
    autoplayToggled: new Emitter<boolean>(),
    removeButtonsToggled: new Emitter<boolean>(),
    addButtonsToggled: new Emitter<boolean>(),
    downloadButtonsToggled: new Emitter<boolean>(),
    captionsToggled: new Emitter<boolean>(),
    postOverlayToggled: new Emitter<boolean>(),
    sortAscendingToggled: new Emitter<boolean>(),
    galleryMenuToggled: new Emitter<boolean>(),
    blacklistToggled: new Emitter<boolean>(),
    infiniteScrollToggled: new Emitter<boolean>()
  },
  gallery: {
    previewOverridden: new Emitter<boolean>(),
    openedGallery: new Emitter<HTMLElement>(),
    closedGallery: new Emitter<void>(),
    displayedThumb: new Emitter<HTMLElement>(),
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
  postOverlay: {
    addTagToSearch: new Emitter<string>(),
    excludeTagFromSearch: new Emitter<string>(),
    searchForTag: new Emitter<string>()
  },
  searchPage: {
    searchPageInitialized: new StickyEmitter<void>(),
    layoutChanged: new Emitter<Layout>(),
    initialSearchPageCreated: new StickyEmitter<SearchPage>(),
    upscaleToggled: new Emitter<boolean>(),
    infiniteScrollToggled: new Emitter<boolean>(),
    moreResultsAdded: new Emitter<HTMLElement[]>(),
    pageChanged: new Emitter<HTMLElement[]>(),
    favoriteIndicatorToggled: new Emitter<boolean>(),
    favoriteIndicatorStyleChanged: new Emitter<FavoriteIndicatorStyle>()
  },
  mobile: {
    swipedUp: new Emitter<void>(),
    swipedDown: new Emitter<void>(),
    swipedLeft: new Emitter<void>(),
    swipedRight: new Emitter<void>(),
    touchHold: new Emitter<TouchEvent>()
  }
};
