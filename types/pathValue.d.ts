import type { Idx } from './idx';
import type { Paths } from './paths';

/**
 * PathValue will return us all the possible values for a given type.
 * ex: PathValue<{ a: string, b: { c: string } }, Paths<{ a: string, b: { c: string } }>>
 */

export type PathValue<
  T,
  P extends Paths<T, 4>
> = P extends `${infer Key}.${infer Rest}`
  ? Rest extends Paths<Idx<T, Key>, 4>
    ? PathValue<Idx<T, Key>, Rest>
    : never
  : Idx<T, P>;
