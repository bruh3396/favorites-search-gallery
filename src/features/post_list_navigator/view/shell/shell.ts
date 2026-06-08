import * as PostListNavigatorDesktopMenu from "@/features/post_list_navigator/control/desktop_menu";
import * as PostListNavigatorNativeThumbPreparer from "@/features/post_list_navigator/view/shell/native_thumb_preparer";
import * as PostListNavigatorOptionVisibility from "@/features/post_list_navigator/view/shell/option_visibility";
import * as PostListNavigatorScaffold from "@/features/post_list_navigator/view/shell/scaffold";

export function create(): Promise<void> {
  PostListNavigatorScaffold.setup();
  PostListNavigatorOptionVisibility.hideUnusedOptions();
  PostListNavigatorDesktopMenu.create();
  return PostListNavigatorNativeThumbPreparer.prepareNativePostListThumbs();
}
