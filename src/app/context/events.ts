import { Emitter, StickyEmitter } from "@/lib/event/emitter";
import { Favorite } from "@/types/favorite";
import { GalleryMenuAction } from "@/types/app";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export class Events {
  public readonly app = {
    favoriteAdded: new Emitter<string>(),
    favoriteRemoved: new Emitter<string>(),
    hotkeyPressed: new Emitter<string>()
  };

  public readonly favorites = {
    clearButtonClicked: new Emitter<MouseEvent>(),
    invertButtonClicked: new Emitter<MouseEvent>(),
    resetButtonClicked: new Emitter<MouseEvent>(),
    searchButtonClicked: new Emitter<MouseEvent>(),
    shuffleButtonClicked: new Emitter<MouseEvent>(),

    searchRequested: new Emitter<string>(),
    searchResultsUpdated: new Emitter<Favorite[]>(),

    favoritesLoaded: new StickyEmitter<void>(),
    storedFavoritesFound: new StickyEmitter<boolean>(),
    storedFavoritesLoaded: new StickyEmitter<void>(),

    contentAdded: new Emitter<Favorite[]>(),
    contentReplaced: new Emitter<void>()
  };

  public readonly gallery = {
    closedGallery: new Emitter<void>(),
    displayedThumb: new Emitter<HTMLElement>(),
    galleryMenuButtonClicked: new Emitter<GalleryMenuAction>(),
    interactionStopped: new Emitter<void>(),
    leftTap: new Emitter<void>(),
    openedGallery: new Emitter<HTMLElement>(),
    rightTap: new Emitter<void>(),
    showControlsRequested: new Emitter<void>()
  };

  public readonly postOverlay = {
    addTagToSearch: new Emitter<string>(),
    excludeTagFromSearch: new Emitter<string>(),
    searchForTag: new Emitter<string>()
  };

  public readonly postList = {
    initialPostListCreated: new StickyEmitter<PostList>(),
    moreResultsAdded: new Emitter<HTMLElement[]>(),
    pageChanged: new Emitter<HTMLElement[]>(),
    postListInitialized: new StickyEmitter<void>()
  };
}
