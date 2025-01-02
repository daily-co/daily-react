import { atom, Getter, WritableAtom } from 'jotai';

export function jotaiDebugLabel(label: string) {
  return 'daily-react-' + label;
}

interface EqualAtomOptions<T> {
  key?: string;
  get: () => T;
  equals: (a: T, b: T) => boolean;
}

/**
 * Same API as Recoil's selector but with an additional `equals` key.
 * Allows to run custom equality checks before returning a new calculated value.
 * Use this when returning non-primitive types from state.
 */
export function equalAtom<T>(options: EqualAtomOptions<T>) {
  const baseAtom = atom(options.get);
  const derivedAtom = atom((get) => {
    const latest = get(baseAtom);
    if (prior !== undefined && options.equals(latest, prior)) {
      return prior;
    }
    prior = latest;
    return latest;
  });

  let prior: T | undefined;
  return derivedAtom;
}

/**
 * A custom implementation of `equalAtomFamily` for Jotai,
 * providing similar functionality to Recoil's `selectorFamily`
 * with an additional `equals` key for custom equality checks.
 */
interface EqualAtomFamilyOptions<T, P> {
  get: (param: P) => (get: Getter) => T;
  equals: (a: T, b: T) => boolean;
}

export function equalAtomFamily<T extends unknown[], P>(
  options: EqualAtomFamilyOptions<T, P>
): (param: P) => WritableAtom<T, T, void> {
  const atomCache = new Map<P, WritableAtom<T, T, void>>();
  const priorValues: Map<P, T | undefined> = new Map();

  return (param: P) => {
    if (!atomCache.has(param)) {
      const baseAtom = atom((get) => {
        const derivedValue = options.get(param)(get);
        const prior = priorValues.get(param);
        if (prior != null && options.equals(derivedValue, prior)) {
          return prior;
        }
        priorValues.set(param, derivedValue);
        return derivedValue;
      });

      atomCache.set(param, baseAtom as WritableAtom<T, T, void>);
    }

    return atomCache.get(param)!;
  };
}
