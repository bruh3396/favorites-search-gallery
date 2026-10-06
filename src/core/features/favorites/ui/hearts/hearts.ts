import { Readable, effect } from "@/core/utils/reactive/signal";

export const FavoriteHeartClass = {
  root: "fsg-FavoriteHeart"
} as const;

export interface FavoriteHeartsOptions {
  container: HTMLElement;
  favoritedChanges: Readable<ReadonlyMap<string, boolean>>;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

export interface FavoriteHearts {
  createHeart: (id: string) => HTMLButtonElement;
  dispose: () => void;
}

export function createFavoriteHearts(ownerDocument: Document, options: FavoriteHeartsOptions): FavoriteHearts {
  const { container, favoritedChanges, addFavorite, removeFavorite } = options;
  const isFavorited = (id: string): boolean => favoritedChanges.peek().get(id) ?? true;
  const onClick = (event: Event): void => {
    const id = (event.target as Element).closest<HTMLElement>(`.${FavoriteHeartClass.root}`)?.dataset.postId;

    if (id !== undefined) {
      (isFavorited(id) ? removeFavorite : addFavorite)(id);
    }
  };
  const disposeChanges = effect(() => showChanges(container, favoritedChanges.value));

  container.addEventListener("click", onClick);
  return {
    createHeart: (id): HTMLButtonElement => createHeart(ownerDocument, { id, isFavorited: isFavorited(id) }),
    dispose: (): void => {
      disposeChanges();
      container.removeEventListener("click", onClick);
    }
  };
}

function createHeart(ownerDocument: Document, { id, isFavorited }: { id: string; isFavorited: boolean }): HTMLButtonElement {
  const heart = ownerDocument.createElement("button");

  heart.className = FavoriteHeartClass.root;
  heart.type = "button";
  heart.textContent = "♥";
  heart.dataset.postId = id;
  heart.setAttribute("aria-label", "Favorite");
  heart.setAttribute("aria-pressed", String(isFavorited));
  return heart;
}

function showChanges(container: HTMLElement, changes: ReadonlyMap<string, boolean>): void {
  for (const [id, isFavorited] of changes) {
    for (const heart of container.querySelectorAll(`.${FavoriteHeartClass.root}[data-post-id="${id}"]`)) {
      heart.setAttribute("aria-pressed", String(isFavorited));
    }
  }
}
