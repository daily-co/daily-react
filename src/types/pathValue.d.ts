import type { Paths } from './paths';

/**
 * PathValue will return us all the possible values for a given type.
 * ex: PathValue<{ a: string, b: { c: string } }, 'a'> will return 'string'
 */

export type PathValue<T, P> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Paths<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;
