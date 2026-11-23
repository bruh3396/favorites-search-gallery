import { KeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";

export function createKeyBindings<Command extends string>(
  commands: readonly Command[],
  keyBindingOverrides?: KeyBindingOverrides<Command>
): KeyBindings<Command> {
  return Object.fromEntries(commands.map(command => [command, keyBindingOverrides?.[command] ?? []])) as KeyBindings<Command>;
}
