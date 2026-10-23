import { FAVORITES_APP_STYLES, FavoritesApp } from "@/core/app/favorites/app";
import { FavoritesConfiguration, FavoritesDependencies, createFavoritesService } from "@/core/features/favorites/favorites";
import { createAppPreferences, pickPostGridPreferences } from "@/core/app/preferences";
import { APP_FONT } from "@/core/app/font";
import { ColorScheme } from "@/core/boundary/environment";
import { DECODE_RATE_LIMIT } from "@/core/ui/post_grid/upscaler";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearchPanelProps } from "@/core/app/favorites/panel/search";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { FavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/workspace";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { ListSequence } from "@/core/domain/media/list_sequence";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { PageVisibility } from "@/core/boundary/ports/page_visibility/page_visibility";
import { PostActions } from "@/core/app/post_actions";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SkeletonDimensions } from "@/core/app/favorites/storage/skeleton_dimensions";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createAppStorage } from "@/core/app/app_storage";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { doNothing } from "@/core/utils/function/function";
import { fillRestOfWindow } from "@/core/ui/app_root/fill_rest_of_window";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { render } from "@/core/ui/h/h";

export type ExitIndicator = "none" | "zoom";

const LIGHTBOX_EXIT_INDICATOR: ExitIndicator = "zoom";

export interface FavoritesAppConfiguration extends FavoritesConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
  readonly returnIndicator?: ExitIndicator;
}

export interface FavoritesAppDependencies extends Omit<FavoritesDependencies, "paginationSettings"> {
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  remotePages: RemotePages;
  localKeyedValues: LocalKeyedValues;
  morpher: Morpher;
  navigator: Navigator;
  fileSaver: FileSaver;
  pageVisibility: PageVisibility;
}

export function composeFavoritesApp(configuration: FavoritesAppConfiguration, dependencies: FavoritesAppDependencies): MountableApp {
  const { favoritesOwnerId, colorScheme, returnIndicator = LIGHTBOX_EXIT_INDICATOR, ...favoritesConfiguration } = configuration;
  const { remotePages, localKeyedValues, morpher, navigator, fileSaver, visibilityObserver, sizeObserver, pageVisibility, ...ports } = dependencies;
  const storage = createAppStorage(localKeyedValues);
  const preferences = createAppPreferences(storage.preferences);
  const gridPreferences = pickPostGridPreferences(preferences);
  const paginationSettings = preferences.favoritesPagination;
  const skeletonDimensions = new SkeletonDimensions({ ownerId: favoritesOwnerId }, { storage: storage.app });
  const favoritesService = createFavoritesService(favoritesConfiguration, { ...ports, paginationSettings });
  const workspace = new FavoritesWorkspace({ favoritesOwnerId }, {
    storage: storage.app,
    createSession: (settings): FavoritesSession => favoritesService.createSession({ settings })
  });
  const postActions = new PostActions({ remoteMedia: ports.remoteMedia, remotePages, navigator, fileSaver });
  const lightbox = createLightbox<Favorite>({
    scheduler: ports.scheduler, sizeObserver, remoteMedia: ports.remoteMedia, actions: postActions,
    volume: preferences.lightboxVolume, muted: preferences.lightboxMuted, morpher: returnIndicator === "zoom" ? morpher : undefined,
    locateItem: item => workspace.locate(item)
  });
  const decodeLimiter = new RateLimiter(DECODE_RATE_LIMIT, ports.scheduler);

  lightbox.settled.on(item => workspace.turnToPageContaining(item));
  lightbox.closed.on(item => workspace.reveal(item));

  function createPanelProps(tab: FavoritesTab): FavoritesSearchPanelProps {
    return {
      ...tab, favorites: favoritesService, gridPreferences, upscalePaused: lightbox.isOpen,
      skeletonDimensions: skeletonDimensions.value, skeletonItemCount: paginationSettings.peek().size,
      visibilityObserver, scheduler: ports.scheduler,
      decodeStill: (media, signal, width) => decodeLimiter.run(() => ports.remoteMedia.decodeStill(media, signal, width), signal),
      resolvePreviewUrl: media => ports.remoteMedia.resolvePreviewUrl(media), getPostUrl: post => remotePages.postUrl(post.id),
      onSearch: query => tab.session.submit(query),
      onPlainClick: post => lightbox.open(new ListSequence({ wraps: !paginationSettings.peek().infiniteScroll }, tab.session.results), post),
      onCtrlClick: post => postActions.openOriginal(post), onPointerEnter: doNothing
    };
  }

  pageVisibility.hidden.on(() => skeletonDimensions.record(workspace.activeTab.peek().session.results.peek()));
  return {
    mount: (container): void => {
      const app = mountAppRoot(container, { colorScheme, font: APP_FONT, styles: FAVORITES_APP_STYLES });

      app.append(...render(container.ownerDocument, () => FavoritesApp({
        favorites: favoritesService, workspace, lightbox, panel: createPanelProps
      })).result);
      fillRestOfWindow(app, sizeObserver);
      favoritesService.load().catch(console.error);
    }
  };
}
