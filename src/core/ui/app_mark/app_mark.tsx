import { ContextMenu } from "@/core/ui/components/context_menu/context_menu";
import { ContextMenuItem } from "@/core/ui/components/context_menu/context_menu_item";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const AppMarkClass = {
  root: "fsg-AppMark",
  logo: "fsg-AppMark-logo",
  version: "fsg-AppMark-version"
} as const;

export interface AppMarkProps {
  scriptVersion: string;
  contextMenuItems: readonly ContextMenuItem[];
}

export function AppMark({ scriptVersion, contextMenuItems }: AppMarkProps): HTMLElement {
  const title = `Favorites Search Gallery ${scriptVersion}`;
  return h(ContextMenu, {
    target: (
      <button type="button" className={AppMarkClass.root} aria-label={title} title={title}>
        {createIcon("logo", AppMarkClass.logo)}
        <span className={AppMarkClass.version}>{scriptVersion.split("-")[0]}</span>
      </button>
    ),
    opensOn: "click",
    listItems: () => contextMenuItems
  });
}
