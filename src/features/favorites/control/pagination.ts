import { Events } from "@/app/context/events";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesPaginationAction } from "@/features/favorites/types/types";
import { NavigationKey } from "@/types/input";

export function setup(events: Events, pagination: HTMLElement): void {
  const { pageSelected, pageStepped, gotoPageToggled, gotoPageSubmitted } = events.favorites;
  const submitGotoPage = (): void => gotoPageSubmitted.emit(gotoPageValue(pagination));
  const actions: Record<FavoritesPaginationAction, (value?: string) => void> = {
    page: page => pageSelected.emit(Number(page)),
    step: direction => pageStepped.emit(direction as NavigationKey),
    gotoToggle: () => gotoPageToggled.emit(),
    gotoSubmit: submitGotoPage
  };

  pagination.addEventListener("click", event => {
    const { action, value } = buttonOf(event.target)?.dataset ?? {};

    if (action !== undefined && action in actions) {
      actions[action as FavoritesPaginationAction](value);
    }
  });
  pagination.addEventListener("keydown", event => {
    if (event.key === "Enter" && isGotoPageInput(event.target)) {
      submitGotoPage();
    }
  });
}

function buttonOf(target: EventTarget | null): HTMLButtonElement | null {
  return target instanceof Element ? target.closest("button") : null;
}

function isGotoPageInput(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.closest(`#${FavoritesId.gotoPageInput}`) !== null;
}

function gotoPageValue(pagination: HTMLElement): number {
  return parseInt(pagination.querySelector<HTMLInputElement>(`#${FavoritesId.gotoPageInput} input`)?.value ?? "1", 10);
}
