/**
 * Paths will return us all the possible paths for a given type.
 * ex: Paths<{ a: string, b: { c: string } }> will give us -> ['a', 'b', 'b.c']
 */

export type Paths<T, Key extends keyof T = keyof T> = Key extends string
  ? T[Key] extends Date | MediaStreamTrack
    ? Key
    : T[Key] extends Record<string, any>
    ?
        | `${Key}.${Paths<T[Key], Exclude<keyof T[Key], keyof Array<any>>> &
            string}`
        | `${Key}.${Exclude<keyof T[Key], keyof Array<any>> & string}`
        | Key
    : Key
  : never;
