import { isRecord, isString } from "@/core/utils/guard/unknown_utilities";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { createListGuard } from "@/core/utils/guard/guard";

export type KeyBindingOverrides<Command extends string> = Readonly<Partial<Record<Command, readonly string[]>>>;

const isKeyList = createListGuard(isString);

export function isKeyBindingOverrides<Command extends string>(raw: unknown): raw is KeyBindingOverrides<Command> {
  return isRecord(raw) && Object.values(raw).every(isKeyList);
}

export function applyKeyBindingOverrides<Command extends string>(
  defaultKeyBindings: KeyBindings<Command>,
  keyBindingOverrides: KeyBindingOverrides<Command>
): KeyBindings<Command> {
  const commands = Object.keys(defaultKeyBindings) as Command[];
  return Object.fromEntries(commands.map(command => [command, keyBindingOverrides[command] ?? defaultKeyBindings[command]])) as KeyBindings<Command>;
}
