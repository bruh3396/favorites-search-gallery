export type KeyBindings<Command extends string> = Readonly<Record<Command, readonly string[]>>;

export function findCommandInKeyBindings<Command extends string>(keyBindings: KeyBindings<Command>, key: string): Command | undefined {
  return (Object.keys(keyBindings) as Command[]).find(command => keyBindings[command].includes(key));
}
