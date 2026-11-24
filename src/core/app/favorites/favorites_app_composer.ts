import { DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, ImageLoaderService } from "@/core/ui/post_grid/image_loading/image_loader_service";
import { DEFAULT_SEARCH_HISTORY_CONFIGURATION, SearchHistory } from "@/core/utils/collection/search_history";
import { FAVORITES_APP_STYLES, FavoritesApp } from "@/core/app/favorites/favorites_app";
import { FavoritesServiceConfiguration, FavoritesServiceDependencies, createFavoritesService } from "@/core/features/favorites/favorites_service";
import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { THEME_DEFINITIONS, Theme } from "@/core/ui/theme/theme";
import { h, render } from "@/core/ui/h/h";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { ActivityBar } from "@/core/ui/components/activity_bar/activity_bar";
import { AppMark } from "@/core/ui/app_mark/app_mark";
import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";
import { ColorScheme } from "@/core/boundary/environment/color_scheme";
import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";
import { DEFAULT_APP_FONT } from "@/core/ui/fonts/default_app_font";
import { DEFAULT_FAVORITES_KEY_BINDINGS } from "@/core/app/favorites/commands/default_favorites_key_bindings";
import { DEFAULT_LIGHTBOX_KEY_BINDINGS } from "@/core/features/lightbox/commands/default_lightbox_key_bindings";
import { FAVORITES_COMMAND_DEFINITIONS } from "@/core/app/favorites/commands/favorites_command";
import { FAVORITES_KEY_BINDINGS_TOOL } from "@/core/app/favorites/key_bindings/favorites_key_bindings_tool";
import { FAVORITES_SETTINGS_TOOL } from "@/core/app/favorites/settings/favorites_settings_tool";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteSizeRecorder } from "@/core/app/favorites/search_panel/favorite_size_recorder";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { FavoritesWorkspace } from "@/core/app/favorites/workspace/favorites_workspace";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { ListSequence } from "@/core/features/lightbox/navigation/list_sequence";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { MountableApp } from "@/core/app/mountable_app";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { SNIPPETS_TOOL } from "@/core/features/snippets/snippets_tool";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { SnippetLibrary } from "@/core/features/snippets/snippet_library";
import { SnippetsPane } from "@/core/features/snippets/snippets_pane";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";
import { TabStrip } from "@/core/ui/components/tabs/tab_strip";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { applyKeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { bindHostAppearance } from "@/core/app/host_appearance_binder";
import { composeFavoriteLightboxDetails } from "@/core/app/favorites/lightbox/favorite_lightbox_details_composer";
import { composeFavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings_composer";
import { composeFavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel_composer";
import { composeFavoritesSettings } from "@/core/app/favorites/settings/favorites_settings_composer";
import { createAppStorage } from "@/core/app/storage/app_storage";
import { createFavoritesCommandHandlers } from "@/core/app/favorites/commands/favorites_command_handlers";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { createSharedPreferences } from "@/core/app/storage/shared_preferences";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { fillWindow } from "@/core/ui/app_root/window_filler";
import { listenForKeyBindings } from "@/core/ui/key_bindings/key_bindings_listener";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { resetStoredTree } from "@/core/utils/storage/stored_tree_resetter";

export interface FavoritesAppConfiguration extends FavoritesServiceConfiguration {
  readonly favoritesOwnerId: string;
  readonly colorScheme: ColorScheme;
  readonly scriptVersion: string;
}

export interface FavoritesAppDependencies extends Omit<FavoritesServiceDependencies, "favoritesPaginationPreferences" | "postLibrary"> {
  localPosts: LocalPosts;
  localSnippets: LocalSnippets;
  localTagCategories: LocalTagCategories;
  remotePosts: RemotePosts;
  remoteMedia: RemoteMedia;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  viewport: Viewport;
  remotePages: RemotePages;
  storedValueStorage: StoredValueStorage;
  navigator: Navigator;
  fileSaver: FileSaver;
  clipboard: Clipboard;
  hostPage: HostPage;
  confirmer: Confirmer;
}

export function composeFavoritesApp(configuration: FavoritesAppConfiguration, dependencies: FavoritesAppDependencies): MountableApp {
  const { favoritesOwnerId, colorScheme, scriptVersion } = configuration;
  const { localFavorites, localPosts, localTagCategories, remoteFavorites, remotePosts, remoteMedia, remotePages, scheduler, randomSource } = dependencies;
  const { storedValueStorage, localSnippets, hostPage, navigator, fileSaver, sizeObserver, viewport, visibilityObserver, clipboard, confirmer } = dependencies;
  const appStorage = createAppStorage(storedValueStorage);
  const sharedPreferences = createSharedPreferences(appStorage.preferences, colorScheme, hostPage);
  const appPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, appStorage.preferences, ["favorites", "postList"]);
  const { favorites: favoritesPreferences, postList: postListPreferences } = appPreferences;
  const appState = createStoredTree(
    APP_STORAGE_SCHEMA.state,
    appStorage.state,
    ["favorites", "favoritesSearchHistory", "favoritesTabStripVisible", "favoritesSearchOptionsVisible"]
  );
  const { favorites: favoritesState, favoritesSearchHistory, favoritesTabStripVisible, favoritesSearchOptionsVisible } = appState;
  const ownerState = favoritesState.get(favoritesOwnerId);
  const searchHistory = new SearchHistory(DEFAULT_SEARCH_HISTORY_CONFIGURATION, { submittedQueries: favoritesSearchHistory });
  const postLibrary = new PostLibrary({ localPosts, localTagCategories, remotePosts, remoteMedia, scheduler });
  const favoritesService = createFavoritesService({
    userOwnsFavorites: configuration.userOwnsFavorites,
    userLoggedIn: configuration.userLoggedIn,
    blacklistedTags: configuration.blacklistedTags
  }, {
    localFavorites, remoteFavorites, remotePages, scheduler, postLibrary, randomSource,
    favoritesPaginationPreferences: favoritesPreferences.pagination
  });
  const favoritesWorkspace = new FavoritesWorkspace({
    favoritesWorkspaceSnapshot: ownerState.workspace,
    createSession: (favoritesSearchOptions): FavoritesSession => favoritesService.createSession({ favoritesSearchOptions }),
    randomSource
  });
  const favoriteSizeRecorder = new FavoriteSizeRecorder({ measuredCount: 50, recordDelay: 500 }, {
    sizes: ownerState.sizes, scheduler,
    results: computed(() => favoritesWorkspace.activeTab.value.session.matchedFavorites.value)
  });
  const snippetLibrary = new SnippetLibrary({ localSnippets, scheduler });
  const lightboxPreferences = favoritesPreferences.lightbox;
  const postActions = new PostActions({ remoteMedia, remotePages, navigator, fileSaver });
  const lightboxKeyBindings = computed(() => applyKeyBindingOverrides(DEFAULT_LIGHTBOX_KEY_BINDINGS, sharedPreferences.lightboxKeyBindingOverrides.value));
  const lightbox = createLightbox<Favorite>({
    scheduler, sizeObserver, viewport, remoteMedia, actions: postActions,
    preferences: lightboxPreferences,
    lightboxKeyBindings,
    locateItem: favorite => favoritesWorkspace.locate(favorite),
    details: {
      isOpen: lightboxPreferences.details.isOpen,
      createContent: favorite => composeFavoriteLightboxDetails(favorite, {
        preferences: lightboxPreferences.details, clipboard, scheduler, localTagCategories
      })
    },
    favorite: {
      isFavorited: favorite => favoritesService.isFavorited(favorite.id),
      add: (favorite): void => {
        favoritesService.actions.add(favorite.id).catch(console.error);
      }
    }
  });
  const openLightbox = (favoritesSession: FavoritesSession, favorite: Favorite): boolean => lightbox.open(
    new ListSequence({ wraps: !favoritesPreferences.pagination.infiniteScroll.peek() }, favoritesSession.matchedFavorites),
    favorite
  );
  const imageLoaderService = new ImageLoaderService(DEFAULT_IMAGE_LOADER_SERVICE_CONFIGURATION, {
    remoteMedia, scheduler, enabled: favoritesPreferences.grid.hdTilesEnabled, paused: lightbox.isOpen
  });

  lightbox.settled.on(favorite => favoritesWorkspace.turnToPageContaining(favorite));
  lightbox.closed.on(favorite => favoritesWorkspace.reveal(favorite));
  const { tabManager } = favoritesWorkspace;
  const tabCount = computed(() => tabManager.tabs.value.length);
  const zenEnabled = new Signal(false);
  const keyBindings = computed(() => applyKeyBindingOverrides(DEFAULT_FAVORITES_KEY_BINDINGS, favoritesPreferences.keyBindingOverrides.value));
  const previewedTheme = new Signal<Theme | null>(null);
  const resetSettings = (): void => {
    if (confirmer.confirm("Reset settings to their defaults?")) {
      resetStoredTree(
        { sharedPreferences, favoritesPreferences, postListPreferences },
        [
          sharedPreferences.colorScheme, sharedPreferences.lightboxKeyBindingOverrides,
          favoritesPreferences.activeTool, favoritesPreferences.keyBindingOverrides
        ]
      );
    }
  };
  return {
    mount: (container): void => {
      const appRoot = mountAppRoot(container, {
        colorScheme: sharedPreferences.colorScheme.peek(),
        themeDefinition: THEME_DEFINITIONS[sharedPreferences.theme.peek()],
        appFont: DEFAULT_APP_FONT,
        styles: FAVORITES_APP_STYLES
      });

      appRoot.append(...render(container.ownerDocument, () => h(FavoritesApp, {
        favoritesService, favoritesWorkspace, lightboxView: lightbox.createView(), zenEnabled,
        zenExitKeys: computed(() => [...keyBindings.value.toggleZen, ...keyBindings.value.exitZen]),
        activityBar: h(ActivityBar, {
          items: [
            {
              ...FAVORITES_SETTINGS_TOOL,
              renderView: (): HTMLElement => composeFavoritesSettings({
                favoritesPreferences, sharedPreferences, stepperScheduler: scheduler, resetSettings,
                onThemePreview: (theme): void => {
                  previewedTheme.value = theme;
                }
              })
            },
            {
              ...FAVORITES_KEY_BINDINGS_TOOL,
              renderView: (): HTMLElement => composeFavoritesKeyBindings({
                keyBindings, keyBindingOverrides: favoritesPreferences.keyBindingOverrides,
                lightboxKeyBindings, lightboxKeyBindingOverrides: sharedPreferences.lightboxKeyBindingOverrides,
                confirmer
              })
            },
            {
              ...SNIPPETS_TOOL,
              renderView: (): HTMLElement => h(SnippetsPane, {
                snippets: snippetLibrary.snippets,
                isNameTaken: (name, previousName) => snippetLibrary.isNameTaken(name, previousName),
                save: (draftSnippet, previousName): void => {
                  void snippetLibrary.save(draftSnippet, previousName);
                },
                remove: (name): void => {
                  void snippetLibrary.remove(name);
                },
                open: (snippet): void => {
                  void snippetLibrary.recordUse(snippet.name);
                  favoritesWorkspace.searchInNewTab(snippet.query);
                }
              })
            }
          ],
          value: favoritesPreferences.activeTool,
          onValueChange: id => favoritesPreferences.activeTool.set(id),
          footerChild: h(AppMark, { scriptVersion })
        }),
        tabsHeaderChild: h("div", { hidden: computed(() => !favoritesTabStripVisible.value) }, h(TabStrip, {
          tabs: computed(() => tabManager.tabs.value.map(tab => ({ id: tab.id, label: tab.value.title, closable: tab.closable }))),
          activeTabId: tabManager.activeTabId,
          trailingChild: h(StatusText, { text: favoritesService.loadStatus }),
          onActivate: tabId => tabManager.activate(tabId),
          onClose: tabId => favoritesWorkspace.closeTab(tabId),
          onMove: (tabId, index) => tabManager.move(tabId, index),
          onAdd: () => favoritesWorkspace.openBlankTab(),
          onCloseAll: () => favoritesWorkspace.closeAllTabs()
        })),
        renderPanel: favoritesTab => composeFavoritesSearchPanel(favoritesTab, { userOwnsFavorites: configuration.userOwnsFavorites }, {
          favoritesService, favoritesPreferences, favoritesTabStripVisible, favoritesSearchOptionsVisible, tabCount, searchHistory, favoriteSizeRecorder,
          visibilityObserver, sizeObserver, imageLoaderService, remotePages, navigator, postActions,
          openLightbox: favorite => openLightbox(favoritesTab.session, favorite),
          enterZen: (): void => {
            zenEnabled.value = true;
          }
        })
      })).result);
      const windowFill = fillWindow(appRoot, sizeObserver);

      bindHostAppearance(appRoot, { sharedPreferences, hostPage, previewedTheme });
      listenForKeyBindings(
        { keyBindings, commandDefinitionByCommand: FAVORITES_COMMAND_DEFINITIONS },
        {
          target: container.ownerDocument,
          handlers: createFavoritesCommandHandlers({ userOwnsFavorites: configuration.userOwnsFavorites }, {
            favoritesWorkspace, favoritesPreferences, sharedPreferences, favoritesTabStripVisible, favoritesSearchOptionsVisible, zenEnabled, openLightbox
          })
        }
      );
      effect(() => {
        hostPage.setHeaderVisible(favoritesPreferences.nativeHeaderVisible.value);
        windowFill.refit();
      });
      favoritesService.load().catch(console.error);
      snippetLibrary.load().catch(console.error);
    }
  };
}
