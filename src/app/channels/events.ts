import { Emitter, StickyEmitter } from "@/lib/messaging/emitter";
import { FeatureNamespace, GalleryMenuAction } from "@/types/app";
import { Favorite } from "@/types/favorite";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { TagCategoryMap } from "@/types/search";

export const Events = {
  app: {
    favoriteAdded: new Emitter<string>(),
    favoriteRemoved: new Emitter<string>(),
    hotkeyPressed: new Emitter<string>()
  },
  favorites: {
    clearButtonClicked: new Emitter<MouseEvent>(),
    clearSearchScopeButtonClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),
    searchButtonClicked: new Emitter<MouseEvent>(),
    setSearchScopeButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),

    searchRequested: new Emitter<string>(),
    searchResultsUpdated: new Emitter<Favorite[]>(),

    favoritesLoaded: new StickyEmitter<void>(),
    storedFavoritesFound: new StickyEmitter<boolean>(),
    storedFavoritesLoaded: new StickyEmitter<void>(),

    contentAdded: new Emitter<Favorite[]>(),
    contentReplaced: new Emitter<void>(),

    tagCategoriesResolved: new Emitter<TagCategoryMap>()
  },
  gallery: {
    closedGallery: new Emitter<void>(),
    displayedThumb: new Emitter<HTMLElement>(),
    galleryMenuButtonClicked: new Emitter<GalleryMenuAction>(),
    interactionStopped: new Emitter<void>(),
    leftTap: new Emitter<void>(),
    openedGallery: new Emitter<HTMLElement>(),
    rightTap: new Emitter<void>(),
    showControlsRequested: new Emitter<void>()
  },
  postOverlay: {
    addTagToSearch: new Emitter<string>(),
    excludeTagFromSearch: new Emitter<string>(),
    searchForTag: new Emitter<string>()
  },
  postList: {
    initialPostListCreated: new StickyEmitter<PostList>(),
    moreResultsAdded: new Emitter<HTMLElement[]>(),
    pageChanged: new Emitter<HTMLElement[]>(),
    postListInitialized: new StickyEmitter<void>()
  }
} satisfies FeatureNamespace;
