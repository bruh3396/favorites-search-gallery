import { FavoritesClass, FavoritesDrawerViewDescriptor, FavoritesDrawerViews, FavoritesId, favoritesDrawerSidebarIconId, favoritesDrawerViewId } from "@/features/favorites/types/scaffold";
import { FavoritesDrawerView, FavoritesDrawerViewContent, FavoritesDrawerViewMap, FavoritesDrawerViewNames } from "@/types/favorite";
import { createElement, div } from "@/utils/browser/element";
import { removeDataset, setDataset, toggleDataset } from "@/utils/browser/dataset";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesShell } from "@/features/favorites/view/shell/shell";
import { Preferences } from "@/app/context/preferences";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { icon } from "@/lib/ui/icon";

export class FavoritesDrawer {
  private activeView: FavoritesDrawerView;
  private onOpen: () => void = () => { };
  private onViewSelected: (view: FavoritesDrawerView) => void = () => { };

  constructor(
    private readonly preferences: Preferences,
    private readonly shell: FavoritesShell
  ) {
    this.activeView = preferences.favorites.drawerActiveView.value;
  }

  public setup(
    renderers: FavoritesDrawerViewMap, onDrawerOpen: () => void,
    onDrawerViewSelected: (view: FavoritesDrawerView) => void
  ): void {
    this.onOpen = onDrawerOpen;
    this.onViewSelected = onDrawerViewSelected;
    this.toggle(this.preferences.favorites.drawerOpen.value);
    this.applySidebarLabelVisibility();
    this.insertDrawer(renderers);
    this.renderView(this.activeView);
    this.setupViewShortcut(FavoritesId.aboutVersion, "change");
    this.setupViewShortcut(FavoritesId.aboutHelp, "help");
  }

  public toggle(open: boolean): void {
    toggleDataset(this.shell.root, "drawerOpen", open);
  }

  private applySidebarLabelVisibility(): void {
    if (!FavoritesConfig.drawerSidebarLabelsEnabled) {
      setDataset(this.shell.root, "drawerIconOnly", "");
    }
  }

  private insertDrawer(renderers: FavoritesDrawerViewMap): void {
    this.shell.drawerTrack.appendChild(this.buildDrawer(renderers, (view) => this.selectView(view)));
  }

  private buildDrawer(
    renderers: FavoritesDrawerViewMap,
    onDrawerViewSelected: (view: FavoritesDrawerView) => void
  ): HTMLElement {
    return createElement(
      "div",
      {
        id: FavoritesId.drawer,
        className: "u-no-select",
        children: [this.buildSidebar(onDrawerViewSelected), this.buildViews(renderers)]
      }
    );
  }

  private buildSidebar(onDrawerViewSelected: (view: FavoritesDrawerView) => void): HTMLElement {
    const sidebar = div(FavoritesId.drawerSidebar);

    FavoritesDrawerViews.forEach(descriptor => sidebar.appendChild(this.sidebarIcon(descriptor, onDrawerViewSelected)));
    return sidebar;
  }

  private sidebarIcon(descriptor: FavoritesDrawerViewDescriptor, onDrawerViewSelected: (view: FavoritesDrawerView) => void): HTMLElement {
    const { name: view, label, icon: iconName } = descriptor;
    const button = document.createElement("button");

    button.id = favoritesDrawerSidebarIconId(view);
    button.className = FavoritesClass.drawerSidebarIcon;
    button.appendChild(icon(iconName));

    if (FavoritesConfig.drawerSidebarLabelsEnabled) {
      const labelSpan = createElement("span", { className: FavoritesClass.drawerSidebarIconLabel, textContent: label });

      button.appendChild(labelSpan);
    } else {
      addTooltip(button, label, "right");
    }
    button.onclick = (): void => {
      onDrawerViewSelected(view);
    };
    return button;
  }

  private buildViews(builders: FavoritesDrawerViewMap): HTMLElement {
    return createElement("div", {
      id: FavoritesId.drawerViews,
      children: FavoritesDrawerViews.map(descriptor => this.buildView(descriptor, builders[descriptor.name]))
    });
  }

  private buildView(descriptor: FavoritesDrawerViewDescriptor, content: FavoritesDrawerViewContent | undefined): HTMLElement {
    const { name: view, label, title } = descriptor;
    const element = div(favoritesDrawerViewId(view));

    element.className = FavoritesClass.drawerView;
    element.append(this.buildTitle(title ?? label, content?.actions ?? []), this.buildPanel(content?.mount));
    return element;
  }

  private buildTitle(label: string, actions: HTMLElement[]): HTMLElement {
    const labelElement = createElement("span", { className: FavoritesClass.drawerTitleLabel, textContent: label });

    actions.forEach(action => action.classList.add(FavoritesClass.drawerTitleAction));
    return createElement("div", { className: FavoritesClass.drawerTitle, children: [labelElement, ...actions] });
  }

  private buildPanel(mount: ((panel: HTMLElement) => void) | undefined): HTMLElement {
    const panel = createElement("div", { className: FavoritesClass.drawerPanel });

    mount?.(panel);
    return panel;
  }

  private selectView(view: FavoritesDrawerView): void {
    this.onViewSelected(view);
    this.renderView(view);
  }

  private renderView(view: FavoritesDrawerView): void {
    this.activeView = view;

    for (const candidate of FavoritesDrawerViewNames) {
      const isActive = candidate === view;
      const tabElement = document.getElementById(favoritesDrawerSidebarIconId(candidate));
      const viewElement = document.getElementById(favoritesDrawerViewId(candidate));

      if (isActive) {
        setDataset(tabElement, "selected", "");
        removeDataset(viewElement, "hidden");
      } else {
        removeDataset(tabElement, "selected");
        setDataset(viewElement, "hidden", "");
      }
    }
  }

  private setupViewShortcut(elementId: string, view: FavoritesDrawerView): void {
    const element = document.getElementById(elementId);

    if (element === null) {
      return;
    }
    element.onclick = (): void => {
      if (!this.isOpen()) {
        this.onOpen();
      }
      this.selectView(view);
    };
  }

  private isOpen(): boolean {
    return this.shell.root.dataset.drawerOpen !== undefined;
  }
}
