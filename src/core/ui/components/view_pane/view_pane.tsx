import { Child, Reactive, h } from "@/core/ui/h/h";
import { Icon } from "@/core/ui/components/icon/icon";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { Readable } from "@/core/utils/reactive/signal";

export const ViewPaneClass = {
  root: "fsg-ViewPane",
  header: "fsg-ViewPane-header",
  title: "fsg-ViewPane-title",
  toolbar: "fsg-ViewPane-toolbar",
  search: "fsg-ViewPane-search",
  body: "fsg-ViewPane-body"
} as const;

export interface ViewPaneAction {
  readonly label: Reactive<string>;
  readonly icon: Reactive<Icon>;
  readonly disabled?: Readable<boolean>;
  onClick: () => void;
}

export interface ViewPaneProps {
  title: string;
  actions?: readonly ViewPaneAction[];
  searchChild?: Child;
  subheaderChild?: Child;
  children?: Child;
}

export function ViewPane({ title, actions: viewPaneActions = [], searchChild, subheaderChild, children }: ViewPaneProps): HTMLElement {
  return (
    <section className={ViewPaneClass.root}>
      <header className={ViewPaneClass.header}>
        <h2 className={ViewPaneClass.title}>{title}</h2>
        <div className={ViewPaneClass.toolbar} role="toolbar" aria-label={title}>
          {viewPaneActions.map(viewPaneAction => (
            <IconButton
              icon={viewPaneAction.icon}
              label={viewPaneAction.label}
              size="small"
              disabled={viewPaneAction.disabled}
              onClick={viewPaneAction.onClick}
            />
          ))}
        </div>
      </header>
      {searchChild !== undefined && <div className={ViewPaneClass.search}>{searchChild}</div>}
      {subheaderChild}
      <div className={ViewPaneClass.body}>{children}</div>
    </section>
  );
}
