import { FAVORITES_COMMAND_DEFINITIONS, FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindingOverrides, removeKeyFromKeyBindingOverrides, replaceKeyInKeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { KeyBindings, findCommandInKeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { CommandDefinition } from "@/core/ui/key_bindings/command_definition";
import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";
import { FAVORITES_COMMAND_SECTIONS } from "@/core/app/favorites/key_bindings/favorites_command_sections";
import { FavoritesKeyBindings } from "@/core/app/favorites/key_bindings/favorites_key_bindings";
import { FavoritesKeyBindingsSection } from "@/core/app/favorites/key_bindings/favorites_key_bindings_section";
import { LIGHTBOX_COMMAND_SECTION } from "@/core/app/favorites/key_bindings/lightbox_command_section";
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
  readonly commandDefinitionByCommand: Readonly<Record<Command, Pick<CommandDefinition, "label">>>;
  readonly keyBindings: Readable<KeyBindings<Command>>;
  readonly keyBindingOverrides: Pick<StoredValue<KeyBindingOverrides<Command>>, "peek" | "set">;
}

export function composeFavoritesKeyBindings(dependencies: FavoritesKeyBindingsDependencies): HTMLElement {
  const { keyBindings, keyBindingOverrides, lightboxKeyBindings, lightboxKeyBindingOverrides, confirmer } = dependencies;
  const favoritesKeyBindingsEditing = { commandDefinitionByCommand: FAVORITES_COMMAND_DEFINITIONS, keyBindings, keyBindingOverrides };
  return h(FavoritesKeyBindings, {
    sections: [
      ...FAVORITES_COMMAND_SECTIONS.map(({ title, favoritesCommands }) => describeKeyBindingsSection(title, favoritesCommands, favoritesKeyBindingsEditing)),
      describeKeyBindingsSection(LIGHTBOX_COMMAND_SECTION.title, LIGHTBOX_COMMAND_SECTION.lightboxCommands, {
        commandDefinitionByCommand: LIGHTBOX_COMMAND_DEFINITIONS, keyBindings: lightboxKeyBindings, keyBindingOverrides: lightboxKeyBindingOverrides
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
  { commandDefinitionByCommand, keyBindings, keyBindingOverrides }: KeyBindingsEditing<Command>
): FavoritesKeyBindingsSection {
  return {
    title,
    rows: commands.map(command => ({
      label: commandDefinitionByCommand[command].label,
      keys: computed(() => keyBindings.value[command]),
      findKeyOwnerLabel: (key: string): string | undefined => {
        const otherCommand = findCommandInKeyBindings(keyBindings.peek(), key);
        return otherCommand === undefined || otherCommand === command ? undefined : commandDefinitionByCommand[otherCommand].label;
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
