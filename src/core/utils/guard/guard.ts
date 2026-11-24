export type Guard<T> = (raw: unknown) => raw is T;
