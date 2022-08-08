import type { Path } from './test';

/**
 * PathValue will return us all the possible values for a given type.
 * ex: PathValue<{ a: string, b: { c: string } }, Paths<{ a: string, b: { c: string } }>>
 */

export type PathValue<
  T,
  P extends Path<T>
> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;
