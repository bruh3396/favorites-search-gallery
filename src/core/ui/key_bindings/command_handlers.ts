export type CommandHandlers<Command extends string> = Readonly<Record<Command, () => void>>;
