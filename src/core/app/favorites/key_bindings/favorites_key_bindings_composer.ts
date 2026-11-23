import { KeyBindingOverrides, removeKeyFromKeyBindingOverrides, replaceKeyInKeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { FavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { Readable } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { h } from "@/core/ui/h/h";

export interface FavoritesKeyBindingsDependencies {
  keyBindings: Readable<KeyBindings<FavoritesCommand>>;
  keyBindingOverrides: Pick<StoredValue<KeyBindingOverrides<FavoritesCommand>>, "peek" | "set">;
  confirmer: Confirmer;
}

export function composeFavoritesKeyBindings(dependencies: FavoritesKeyBindingsDependencies): HTMLElement {
  const { keyBindings, keyBindingOverrides, confirmer } = dependencies;
  return h(FavoritesKeyBindings, {
    keyBindings,
    resetKeyBindings: (): void => {
      if (confirmer.confirm("Reset all keyboard shortcuts to their defaults?")) {
        keyBindingOverrides.set({});
      }
    },
    onKeyChange: (favoritesCommand, keyIndex, key): void => {
      keyBindingOverrides.set(replaceKeyInKeyBindingOverrides(
        keyBindingOverrides.peek(),
        keyBindings.peek(),
        { command: favoritesCommand, keyIndex, key }
      ));
    },
    onKeyRemove: (favoritesCommand, keyIndex): void => {
      keyBindingOverrides.set(removeKeyFromKeyBindingOverrides(keyBindingOverrides.peek(), keyBindings.peek(), { command: favoritesCommand, keyIndex }));
    }
  });
}
