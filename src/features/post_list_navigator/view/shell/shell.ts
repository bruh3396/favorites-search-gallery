import * as PostListNavigatorDesktopMenu from "@/features/post_list_navigator/control/desktop_menu";
import * as PostListNavigatorOptionVisibility from "@/features/post_list_navigator/view/shell/option_visibility";
import * as PostListNavigatorScaffold from "@/features/post_list_navigator/view/shell/scaffold";

export function build(): void {
  PostListNavigatorScaffold.insert();
  PostListNavigatorOptionVisibility.hideUnusedOptions();
  PostListNavigatorDesktopMenu.build();
}
