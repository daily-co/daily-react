import type { Join } from './join';
import type { Prev } from './prev';

/**
 * Paths will return us all the possible paths for a given type.
 * ex: Paths<{ a: string, b: { c: string } }> will give us -> ['a', 'b', 'b.c']
 */

export type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never;
    }[keyof T]
  : '';
