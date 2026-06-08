import * as FavoritesActions from "@/lib/remote/rule34/favorites_actions";
import { AddFavoriteStatus } from "@/types/favorite";
import { ClickCode } from "@/types/input";
import { Events } from "@/app/channels/events";

export function setupAddFavoriteButtons(thumbs: HTMLElement[]): void {
  for (const thumb of thumbs) {
    const button = thumb.querySelector(".post-action-btn--add");

    if (button instanceof HTMLElement) {
      setupButton(thumb, button);
    }
  }
}

function setupButton(thumb: HTMLElement, button: HTMLElement): void {
  button.onmousedown = (event): void => {
    event.stopPropagation();

    if (event.button !== ClickCode.Left) {
      return;
    }
    FavoritesActions.addFavorite(thumb.id).then(status => {
      if (status === AddFavoriteStatus.Success) {
        Events.favorites.favoriteAdded.emit(thumb.id);
      }
    });
    button.remove();
  };
}
