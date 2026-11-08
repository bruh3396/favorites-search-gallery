import { isRecord, isString } from "@/core/utils/guard/unknown_utilities";
import { createListGuard } from "@/core/utils/guard/guard";

export type KeyBindings<Command extends string> = Readonly<Partial<Record<Command, readonly string[]>>>;

const isKeyList = createListGuard(isString);

export function isKeyBindings<Command extends string>(raw: unknown): raw is KeyBindings<Command> {
  return isRecord(raw) && Object.values(raw).every(isKeyList);
}

export function mergeKeyBindings<Command extends string>(defaultKeyBindings: KeyBindings<Command>, keyBindings: KeyBindings<Command>): KeyBindings<Command> {
  const commands = Object.keys(defaultKeyBindings) as Command[];
  return Object.fromEntries(commands.map(command => [command, keyBindings[command] ?? defaultKeyBindings[command]])) as KeyBindings<Command>;
}

export function findCommandInKeyBindings<Command extends string>(keyBindings: KeyBindings<Command>, key: string): Command | undefined {
  const normalizedKey = normalizeKey(key);
  return (Object.keys(keyBindings) as Command[]).find(command => keyBindings[command]?.includes(normalizedKey) === true);
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}
