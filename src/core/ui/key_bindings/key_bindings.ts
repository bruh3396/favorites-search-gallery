export type KeyBindings<Command extends string> = Readonly<Record<Command, readonly string[]>>;

export function findCommandInKeyBindings<Command extends string>(keyBindings: KeyBindings<Command>, key: string): Command | undefined {
  const normalizedKey = normalizeKey(key);
  return (Object.keys(keyBindings) as Command[]).find(command => keyBindings[command].includes(normalizedKey));
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}
