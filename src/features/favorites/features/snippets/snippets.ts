import * as SnippetsPanel from "@/features/favorites/features/snippets/panel";
import { FavoritesDrawerViewContent } from "@/types/app";
import { SnippetStore } from "@/features/favorites/features/snippets/store";
import { SnippetsCallbacks } from "@/features/favorites/features/snippets/types";
import { Storage } from "@/lib/storage/local_storage";
import { sortByRecentlyUsed } from "@/features/favorites/features/snippets/sorter";

const store = new SnippetStore(Storage);

let appendToSearch: (text: string) => void = () => { };

export function setup(callbacks: SnippetsCallbacks): void {
  appendToSearch = callbacks.appendToSearch;
  SnippetsPanel.setup(useSnippet);
  render();
}

function useSnippet(name: string): void {
  const snippet = store.get(name);

  if (snippet === undefined) {
    return;
  }
  appendToSearch(snippet.query);
  store.use(name);
  render();
}

export function mount(): FavoritesDrawerViewContent {
  return { mount: SnippetsPanel.mount };
}

function render(): void {
  SnippetsPanel.render(sortByRecentlyUsed(store.getAll()));
}
