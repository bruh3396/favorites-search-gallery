import { FeatureNamespaced, GalleryMenuAction } from "@/types/app";
import { Emitter } from "@/lib/communication/emitter";
import { Favorite } from "@/types/favorite";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { StickyEmitter } from "@/lib/communication/sticky_emitter";
import { TagCategoryMap } from "@/types/search";

export const Events = {
  app: {
    favoriteAdded: new Emitter<string>(),
    favoriteRemoved: new Emitter<string>()
  },
  favorites: {
    searchStarted: new Emitter<string>(),
    pageChanged: new Emitter<void>(),
    findFavorite: new Emitter<string>(),
    findFavoriteInAll: new Emitter<string>(),
    favoritesFoundInDatabase: new StickyEmitter<boolean>(),
    favoritesDatabaseLoaded: new StickyEmitter<void>(),
    favoritesLoaded: new StickyEmitter<void>(),

    searchResultsUpdated: new Emitter<Favorite[]>(),
    tagCategoriesResolved: new Emitter<TagCategoryMap>(),
    newFavoritesFound: new Emitter<Favorite[]>(),
    favoritesAddedToCurrentPage: new Emitter<Favorite[]>(),
    resetConfirmed: new Emitter<void>(),

    setSearchScopeButtonClicked: new Emitter<MouseEvent>(),
    clearSearchScopeButtonClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),
    searchButtonClicked: new Emitter<MouseEvent>(),
    clearButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),
    panelButtonClicked: new Emitter<MouseEvent>()
  },
  gallery: {
    openedGallery: new Emitter<HTMLElement>(),
    closedGallery: new Emitter<void>(),
    displayedThumb: new Emitter<HTMLElement>(),
    galleryMenuButtonClicked: new Emitter<GalleryMenuAction>(),
    rightTap: new Emitter<void>(),
    leftTap: new Emitter<void>(),
    interactionStopped: new Emitter<void>()
  },
  postOverlay: {
    addTagToSearch: new Emitter<string>(),
    excludeTagFromSearch: new Emitter<string>(),
    searchForTag: new Emitter<string>()
  },
  postList: {
    postListInitialized: new StickyEmitter<void>(),
    initialPostListCreated: new StickyEmitter<PostList>(),
    moreResultsAdded: new Emitter<HTMLElement[]>(),
    pageChanged: new Emitter<HTMLElement[]>()
  }
} satisfies FeatureNamespaced;
