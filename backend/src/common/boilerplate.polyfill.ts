export type Optional<T> = T | undefined;

export type Constructor<T, Arguments extends unknown[] = unknown[]> = new (
  ...arguments_: Arguments
) => T;
