/**
 * `Reconstruct` type utility.
 *
 * Given an object type `T`, a discriminator key `Key`, and a specific value `Value` for that key,
 * it reconstructs `T` such that the property denoted by `Key` is narrowed to just `Value`.
 *
 * Other properties of `T` remain unchanged.
 *
 * Example:
 *
 * If T = {
 *    category: 'x' | 'y';
 *    someProp: number;
 * }
 *
 * Key = 'category'
 * Value = 'x'
 *
 * Then, Reconstruct<T, Key, Value> will yield:
 *
 * {
 *    category: 'x';
 *    someProp: number;
 * }
 *
 */
export type Reconstruct<
  T,
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> = {
  [P in keyof T]: P extends K ? V : T[P];
};
