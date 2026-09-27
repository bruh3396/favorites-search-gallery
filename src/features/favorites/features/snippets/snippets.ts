import { AwesompleteSuggestion } from "awesomplete";
import { FavoritesDrawerSectionContent } from "@/types/favorites_ui";
import { SnippetControl } from "@/features/favorites/features/snippets/control/control";
import { SnippetFlows } from "@/features/favorites/features/snippets/flows/flows";
import { SnippetModel } from "@/features/favorites/features/snippets/model/model";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";
import { SnippetView } from "@/features/favorites/features/snippets/view/view";
import { SnippetsDependencies } from "@/features/favorites/features/snippets/types/types";
import { Storage } from "@/lib/storage/local_storage";
import { downloadBlob } from "@/utils/browser/download";

export class Snippets {
  private readonly flows: SnippetFlows;
  private readonly control: SnippetControl;

  constructor({ appendToSearch, getSearchResults }: SnippetsDependencies) {
    const shell = new SnippetShell();
    const context = {
      appendToSearch,
      getSearchResults,
      alert: (message: string): void => alert(message),
      confirm: (message: string): boolean => confirm(message),
      saveBlob: downloadBlob
    };

    this.flows = new SnippetFlows(context, new SnippetModel(Storage), new SnippetView(shell));
    this.control = new SnippetControl(shell, this.flows.library);
  }

  public suggestions(prefix: string): AwesompleteSuggestion[] {
    return this.flows.library.suggestions(prefix);
  }

  public buildDrawerSection(): FavoritesDrawerSectionContent {
    return {
      mount: (container): void => this.flows.library.mount(container),
      actions: this.control.actions
    };
  }
}
