import { FeatureNamespaced, GalleryMenuAction } from "@/types/app";
import { Emitter } from "@/lib/communication/emitter";
import { Favorite } from "@/types/favorite";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { StickyEmitter } from "@/lib/communication/sticky_emitter";
import { TagCategoryMap } from "@/types/search";

export const Events = {
  app: {
    favoriteAdded: new Emitter<string>(),
    favoriteRemoved: new Emitter<string>(),
    hotkeyPressed: new Emitter<string>()
  },
  favorites: {
    searchButtonClicked: new Emitter<MouseEvent>(),
    clearButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),
    setSearchScopeButtonClicked: new Emitter<MouseEvent>(),
    clearSearchScopeButtonClicked: new Emitter<MouseEvent>(),

    searchRequested: new Emitter<string>(),
    searchResultsUpdated: new Emitter<Favorite[]>(),

    storedFavoritesFound: new StickyEmitter<boolean>(),
    storedFavoritesLoaded: new StickyEmitter<void>(),
    favoritesLoaded: new StickyEmitter<void>(),

    contentReplaced: new Emitter<void>(),
    contentAdded: new Emitter<Favorite[]>(),

    tagCategoriesResolved: new Emitter<TagCategoryMap>(),
    resetConfirmed: new Emitter<void>()
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
