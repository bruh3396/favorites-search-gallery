import { KeyBindingOverrides, removeKeyFromKeyBindingOverrides, replaceKeyInKeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { KeyBindings, findCommandInKeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";
import { FAVORITES_COMMAND_LABELS } from "@/core/app/favorites/key_bindings/favorites_command_labels";
import { FAVORITES_COMMAND_SECTIONS } from "@/core/app/favorites/key_bindings/favorites_command_sections";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { FavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings";
import { FavoritesKeyBindingsSection } from "@/core/app/favorites/key_bindings/favorites_key_bindings_section";
import { LIGHTBOX_COMMAND_LABELS } from "@/core/features/lightbox/commands/lightbox_command_labels";
import { LIGHTBOX_COMMAND_SECTION } from "@/core/app/favorites/key_bindings/lightbox_command_section";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { h } from "@/core/ui/h/h";

export interface FavoritesKeyBindingsDependencies {
  keyBindings: Readable<KeyBindings<FavoritesCommand>>;
  keyBindingOverrides: Pick<StoredValue<KeyBindingOverrides<FavoritesCommand>>, "peek" | "set">;
  lightboxKeyBindings: Readable<KeyBindings<LightboxCommand>>;
  lightboxKeyBindingOverrides: Pick<StoredValue<KeyBindingOverrides<LightboxCommand>>, "peek" | "set">;
  confirmer: Confirmer;
}

interface KeyBindingsEditing<Command extends string> {
  readonly labelByCommand: Readonly<Record<Command, string>>;
  readonly keyBindings: Readable<KeyBindings<Command>>;
  readonly keyBindingOverrides: Pick<StoredValue<KeyBindingOverrides<Command>>, "peek" | "set">;
}

export function composeFavoritesKeyBindings(dependencies: FavoritesKeyBindingsDependencies): HTMLElement {
  const { keyBindings, keyBindingOverrides, lightboxKeyBindings, lightboxKeyBindingOverrides, confirmer } = dependencies;
  const favoritesKeyBindingsEditing = { labelByCommand: FAVORITES_COMMAND_LABELS, keyBindings, keyBindingOverrides };
  return h(FavoritesKeyBindings, {
    sections: [
      ...FAVORITES_COMMAND_SECTIONS.map(({ title, favoritesCommands }) => describeKeyBindingsSection(title, favoritesCommands, favoritesKeyBindingsEditing)),
      describeKeyBindingsSection(LIGHTBOX_COMMAND_SECTION.title, LIGHTBOX_COMMAND_SECTION.lightboxCommands, {
        labelByCommand: LIGHTBOX_COMMAND_LABELS, keyBindings: lightboxKeyBindings, keyBindingOverrides: lightboxKeyBindingOverrides
      })
    ],
    resetKeyBindings: (): void => {
      if (confirmer.confirm("Reset all keyboard shortcuts to their defaults?")) {
        keyBindingOverrides.set({});
        lightboxKeyBindingOverrides.set({});
      }
    }
  });
}

function describeKeyBindingsSection<Command extends string>(
  title: string,
  commands: readonly Command[],
  { labelByCommand, keyBindings, keyBindingOverrides }: KeyBindingsEditing<Command>
): FavoritesKeyBindingsSection {
  return {
    title,
    rows: commands.map(command => ({
      label: labelByCommand[command],
      keys: computed(() => keyBindings.value[command]),
      findKeyOwnerLabel: (key: string): string | undefined => {
        const otherCommand = findCommandInKeyBindings(keyBindings.peek(), key);
        return otherCommand === undefined || otherCommand === command ? undefined : labelByCommand[otherCommand];
      },
      onKeyChange: (keyIndex: number, key: string): void => {
        keyBindingOverrides.set(replaceKeyInKeyBindingOverrides(keyBindingOverrides.peek(), keyBindings.peek(), { command, keyIndex, key }));
      },
      onKeyRemove: (keyIndex: number): void => {
        keyBindingOverrides.set(removeKeyFromKeyBindingOverrides(keyBindingOverrides.peek(), keyBindings.peek(), { command, keyIndex }));
      }
    }))
  };
}
