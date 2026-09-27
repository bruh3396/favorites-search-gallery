import * as PostListNavigatorMenu from "@/features/post_list_navigator/control/menu";
import { AppContext } from "@/app/context/context";
import { PostListNavigatorShell } from "@/features/post_list_navigator/shell/shell";

export class PostListNavigatorControl {
  constructor(context: AppContext, shell: PostListNavigatorShell) {
    PostListNavigatorMenu.mount(context, shell.menu);
  }
}
