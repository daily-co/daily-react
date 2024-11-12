import { atom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useDebugValue } from 'react';

import { ExtendedDailyParticipant } from '../DailyParticipants';
import { arraysDeepEqual } from '../lib/customDeepEqual';
import { equalAtomFamily, jotaiDebugLabel } from '../lib/jotai-custom';
import type { NumericKeys } from '../types/NumericKeys';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';

const DELIM = '::';
const PATHS_DELIM = ';';
export const getPropertyParam = (
  id: string,
  property: Paths<ExtendedDailyParticipant>
) => id + DELIM + property;
const getPropertiesParam = (
  id: string,
  properties: Paths<ExtendedDailyParticipant>[]
) => id + DELIM + properties.join(PATHS_DELIM);

export const getParticipantPropertyAtom = (
  id: string,
  property: Paths<ExtendedDailyParticipant>
) => participantPropertyState(getPropertyParam(id, property));

/**
 * Stores all property paths for a given participant.
 */
export const participantPropertyPathsState = atomFamily((id: string) => {
  const participantPropertyPathsAtom = atom<Paths<ExtendedDailyParticipant>[]>(
    []
  );
  participantPropertyPathsAtom.debugLabel = jotaiDebugLabel(
    `participant-property-paths-${id}`
  );
  return participantPropertyPathsAtom;
});

/**
 * Stores resolved values for each participant and property path.
 */
export const participantPropertyState = atomFamily((param: string) => {
  const participantPropertyAtom = atom<any>(null);
  participantPropertyAtom.debugLabel = jotaiDebugLabel(
    `participant-property-${param}`
  );
  return participantPropertyAtom;
});

/**
 * Stores resolved values for each participant and property path.
 */
const participantPropertiesState = equalAtomFamily<any[], string>({
  equals: arraysDeepEqual,
  get: (param: string) => (get) => {
    const [id, paths] = param.split(DELIM);
    const properties = paths.split(PATHS_DELIM);
    return properties.map((path) =>
      get(
        getParticipantPropertyAtom(id, path as Paths<ExtendedDailyParticipant>)
      )
    );
  },
});

type UseParticipantPropertyReturnType<
  T extends ExtendedDailyParticipant,
  P extends Paths<T> | Paths<T>[]
> = P extends Paths<T>[]
  ? { [K in keyof P]: K extends NumericKeys ? PathValue<T, P[K]> : unknown }
  : P extends Paths<T>
  ? PathValue<T, P>
  : never;

/**
 * Returns a participant's property that you subscribe to.
 * @param participantId The participant's session_id.
 * @param propertyPaths the array of participant property that you want to subscribe to.
 */
export const useParticipantProperty = <
  T extends ExtendedDailyParticipant = ExtendedDailyParticipant,
  P extends Paths<T> | [Paths<T>, ...Paths<T>[]] =
    | Paths<T>
    | [Paths<T>, ...Paths<T>[]]
>(
  participantId: string,
  propertyPaths: P
): UseParticipantPropertyReturnType<T, P> => {
  const properties = useAtomValue(
    Array.isArray(propertyPaths)
      ? participantPropertiesState(
          getPropertiesParam(
            participantId,
            propertyPaths as Paths<ExtendedDailyParticipant>[]
          )
        )
      : participantPropertyState(
          getPropertyParam(
            participantId,
            propertyPaths as Paths<ExtendedDailyParticipant>
          )
        )
  );

  useDebugValue(
    Array.isArray(propertyPaths)
      ? propertyPaths.reduce(
          (o: Record<any, any>, path: Paths<T>, i: number) => {
            o[path] = properties[i];
            return o;
          },
          {}
        )
      : {
          [propertyPaths as any]: properties,
        }
  );

  return properties;
};
