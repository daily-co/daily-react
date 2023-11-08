import {
  ReadOnlySelectorFamilyOptions,
  ReadOnlySelectorOptions,
  RecoilValueReadOnly,
  selector,
  selectorFamily,
  SerializableParam,
} from 'recoil';

interface EqualSelectorOptions<T>
  extends Pick<ReadOnlySelectorOptions<T>, 'key' | 'get'> {
  equals: (a: T, b: T) => boolean;
}

/**
 * Same API as [selector](https://recoiljs.org/docs/api-reference/core/selector), but with an additional `equals` key.
 * Allows to run custom equality checks before returning a new calculated value.
 * Use this, when returning non-primitive types from state.
 * Resource: https://github.com/facebookexperimental/Recoil/issues/1416#issuecomment-1044953271
 */
export function equalSelector<T>(
  options: EqualSelectorOptions<T>
): RecoilValueReadOnly<T> {
  const inner = selector({
    key: `${options.key}_inner`,
    get: options.get,
  });

  let prior: T | undefined;

  return selector({
    key: options.key,
    get: ({ get }) => {
      const latest = get(inner);
      if (prior != null && options.equals(latest, prior)) {
        return prior;
      }
      prior = latest;
      return latest as T;
    },
  });
}

interface EqualSelectorFamilyOptions<T, P extends SerializableParam>
  extends Pick<ReadOnlySelectorFamilyOptions<T, P>, 'key' | 'get'> {
  equals: (a: T, b: T) => boolean;
}

/**
 * Same API as [selectorFamily](https://recoiljs.org/docs/api-reference/utils/selectorFamily/), but with an additional `equals` key.
 * Allows to run custom equality checks before returning a new calculated value.
 * Use this, when returning non-primitive types from state.
 * Resource: https://github.com/facebookexperimental/Recoil/issues/1416#issuecomment-1168603409
 */
export function equalSelectorFamily<T, P extends SerializableParam>(
  options: EqualSelectorFamilyOptions<T, P>
) {
  const inner = selectorFamily<T, P>({
    key: `${options.key}_inner`,
    get: options.get,
  });

  const priorValues: Map<P, T | undefined> = new Map();

  return selectorFamily<T, P>({
    ...options,
    key: options.key,
    get:
      (param: P) =>
      ({ get }) => {
        const latest = get(inner(param));
        const prior = priorValues.get(param);
        if (prior != null && options.equals(latest, prior)) {
          return prior;
        }
        priorValues.set(param, latest);
        return latest;
      },
  });
}
