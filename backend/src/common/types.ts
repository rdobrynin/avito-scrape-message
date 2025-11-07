export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
export type Plain<T> = T;

export type Constructor<T = any, Arguments extends unknown[] = any[]> = new (
  ...arguments_: Arguments
) => T;

export type KeyOfType<Entity, U> = {
  [P in keyof Required<Entity>]: Required<Entity>[P] extends U
    ? P
    : Required<Entity>[P] extends U[]
      ? P
      : never;
}[keyof Entity];

export type Reference<T> = T;
