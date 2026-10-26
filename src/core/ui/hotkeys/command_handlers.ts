export type CommandHandlers<C extends string> = Readonly<Record<C, () => void>>;
