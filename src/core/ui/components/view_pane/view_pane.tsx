import { Child, Reactive, h } from "@/core/ui/h/h";
import { Icon } from "@/core/ui/components/icon/icon";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { Readable } from "@/core/utils/reactive/signal";

export const ViewPaneClass = {
  root: "fsg-ViewPane",
  header: "fsg-ViewPane-header",
  title: "fsg-ViewPane-title",
  toolbar: "fsg-ViewPane-toolbar",
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
  children?: Child;
}

export function ViewPane({ title, actions: viewPaneActions = [], children }: ViewPaneProps): HTMLElement {
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
      <div className={ViewPaneClass.body}>{children}</div>
    </section>
  );
}
