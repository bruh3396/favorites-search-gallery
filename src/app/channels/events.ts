import { FavoriteIndicatorStyle, GalleryMenuAction, Layout, PerformanceProfile } from "@/types/ui";
import { MetadataMetric, Rating, TagCategoryMap } from "@/types/search";
import { Emitter } from "@/lib/communication/emitter";
import { Favorite } from "@/types/favorite";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { StickyEmitter } from "@/lib/communication/sticky_emitter";

export const Events = {
  app: {
    favoriteAdded: new Emitter<string>(),
    favoriteRemoved: new Emitter<string>(),
    autoplayToggled: new Emitter<boolean>(),
    tooltipToggled: new Emitter<boolean>(),
    galleryMenuToggled: new Emitter<boolean>(),
    columnCountChanged: new Emitter<number>(),
    rowHeightChanged: new Emitter<number>(),
    performanceProfileChanged: new Emitter<PerformanceProfile>()
  },
  favorites: {
    searchStarted: new Emitter<string>(),
    pageChanged: new Emitter<void>(),
    findFavorite: new Emitter<string>(),
    findFavoriteInAll: new Emitter<string>(),
    favoritesFoundInDatabase: new StickyEmitter<boolean>(),
    favoritesDatabaseLoaded: new StickyEmitter<void>(),
    favoritesLoaded: new StickyEmitter<void>(),

    searchResultsUpdated: new Emitter<void>(),
    tagCategoriesResolved: new Emitter<TagCategoryMap>(),
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
    layoutChanged: new Emitter<Layout>(),
    sortMethodChanged: new Emitter<MetadataMetric>(),

    galleryPreviewToggled: new Emitter<boolean>(),
    captionsToggled: new Emitter<boolean>(),
    postOverlayToggled: new Emitter<boolean>(),
    sortAscendingToggled: new Emitter<boolean>(),
    blacklistToggled: new Emitter<boolean>(),
    infiniteScrollToggled: new Emitter<boolean>()
  },
  gallery: {
    previewOverridden: new Emitter<boolean>(),
    openedGallery: new Emitter<HTMLElement>(),
    closedGallery: new Emitter<void>(),
    displayedThumb: new Emitter<HTMLElement>(),
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
  postList: {
    postListInitialized: new StickyEmitter<void>(),
    layoutChanged: new Emitter<Layout>(),
    initialPostListCreated: new StickyEmitter<PostList>(),
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
