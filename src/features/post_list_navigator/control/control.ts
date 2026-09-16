import { AppContext } from "@/app/context/context";
import { PostListNavigatorScaffold } from "@/features/post_list_navigator/control/scaffold";
import { build as buildSettings } from "@/features/post_list_navigator/control/menu";

export class PostListNavigatorControl {
  private readonly scaffold: PostListNavigatorScaffold;

    constructor(private readonly context: AppContext) {
    this.scaffold = new PostListNavigatorScaffold(context.shell.content);
  }

  public buildShell(): void {
    const panel = this.scaffold.insert();

    if (panel !== null) {
      buildSettings(this.context, panel);
    }
  }
}
