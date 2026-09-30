import { Emitter, StickyEmitter } from "@/lib/event/emitter";
import { Favorite } from "@/types/favorite";
import { GalleryAction } from "@/types/app";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostMedia } from "@/core/domain/post/post";

export type Events = ReturnType<typeof createEvents>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createEvents() {
  return {
    app: {
      favoriteAdded: new Emitter<string>(),
      favoriteRemoved: new Emitter<string>(),
      hotkeyPressed: new Emitter<string>()
    },

    favorites: {
      clearButtonClicked: new Emitter<MouseEvent>(),
      invertButtonClicked: new Emitter<MouseEvent>(),
      resetButtonClicked: new Emitter<MouseEvent>(),
      searchButtonClicked: new Emitter<MouseEvent>(),
      shuffleButtonClicked: new Emitter<MouseEvent>(),
      settingsResetRequested: new Emitter<void>(),

      pageSelected: new Emitter<number>(),
      pageStepped: new Emitter<NavigationKey>(),
      gotoPageToggled: new Emitter<void>(),
      gotoPageSubmitted: new Emitter<number>(),

      searchRequested: new Emitter<string>(),
      postListRequested: new Emitter<string>(),
      searchResultsUpdated: new Emitter<Favorite[]>(),

      favoritesLoaded: new StickyEmitter<void>(),
      storedFavoritesFound: new StickyEmitter<boolean>(),
      storedFavoritesLoaded: new StickyEmitter<void>(),

      contentAdded: new Emitter<Favorite[]>(),
      contentReplaced: new Emitter<void>()
    },

    gallery: {
      galleryClosed: new Emitter<void>(),
      itemDisplayed: new Emitter<PostMedia>(),
      galleryMenuButtonClicked: new Emitter<GalleryAction>(),
      interactionStopped: new Emitter<void>(),
      leftTapped: new Emitter<void>(),
      rightTapped: new Emitter<void>(),
      galleryOpened: new Emitter<void>(),
      tutorialRequested: new Emitter<void>()
    },

    postOverlay: {
      addTagToSearchRequested: new Emitter<string>(),
      excludeTagFromSearchRequested: new Emitter<string>(),
      searchForTagRequested: new Emitter<string>()
    },

    postList: {
      initialPostListCreated: new StickyEmitter<PostList>(),
      moreResultsAdded: new Emitter<HTMLElement[]>(),
      pageChanged: new Emitter<HTMLElement[]>(),
      postListInitialized: new StickyEmitter<void>()
    }
  };
}
