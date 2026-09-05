import * as PostListNavigatorControl from "@/features/post_list_navigator/control/control";
import * as PostListNavigatorScaffold from "@/features/post_list_navigator/view/shell/scaffold";

export function build(): void {
  const panel = PostListNavigatorScaffold.insert();

  if (panel !== null) {
    PostListNavigatorControl.buildSettings(panel);
  }
}
