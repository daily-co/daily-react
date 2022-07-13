import type { Idx } from './idx';
import type { Paths } from './paths';

export type PathValue<
  T,
  P extends Paths<T, 4>
> = P extends `${infer Key}.${infer Rest}`
  ? Rest extends Paths<Idx<T, Key>, 4>
    ? PathValue<Idx<T, Key>, Rest>
    : never
  : Idx<T, P>;
