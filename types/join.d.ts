/**
 * Join will concatenate the given two strings, ex: Join<'a', 'b.c'> will give us -> 'a.b.c'
 */

export type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;
