import * as PostListNavigatorDesktopMenu from "@/features/post_list_navigator/control/desktop_menu";
import * as PostListNavigatorScaffold from "@/features/post_list_navigator/view/shell/scaffold";

export function build(): void {
  const panel = PostListNavigatorScaffold.insert();

  if (panel !== null) {
    PostListNavigatorDesktopMenu.build(panel);
  }
}
