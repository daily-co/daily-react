import { useDebugValue } from 'react';
import { atomFamily, selectorFamily, useRecoilValue } from 'recoil';

import { ExtendedDailyParticipant } from '../DailyParticipants';
import { RECOIL_PREFIX } from '../lib/constants';
import type { NumericKeys } from '../types/NumericKeys';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';

type PropertyType = {
  id: string;
  property: Paths<ExtendedDailyParticipant>;
};

type PropertiesType = {
  id: string;
  properties: Paths<ExtendedDailyParticipant>[];
};

/**
 * Stores all property paths for a given participant.
 */
export const participantPropertyPathsState = atomFamily<
  Paths<ExtendedDailyParticipant>[],
  string
>({
  key: RECOIL_PREFIX + 'participant-property-paths',
  default: [],
});

/**
 * Stores resolved values for each participant and property path.
 */
export const participantPropertyState = atomFamily<any, PropertyType>({
  key: RECOIL_PREFIX + 'participant-property',
  default: null,
  dangerouslyAllowMutability: true, // daily-js mutates track props (_managedByDaily, etc)
});

/**
 * Stores resolved values for each participant and property path.
 */
export const participantPropertiesState = selectorFamily<any, PropertiesType>({
  key: RECOIL_PREFIX + 'participant-properties',
  get:
    ({ id, properties }) =>
    ({ get }) => {
      return properties.map((path) =>
        get(participantPropertyState({ id, property: path }))
      );
    },
  dangerouslyAllowMutability: true, // daily-js mutates track props (_managedByDaily, etc)
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
  const properties = useRecoilValue(
    Array.isArray(propertyPaths)
      ? participantPropertiesState({
          id: participantId,
          properties: propertyPaths as Paths<ExtendedDailyParticipant>[],
        })
      : participantPropertyState({
          id: participantId,
          property: propertyPaths as Paths<ExtendedDailyParticipant>,
        })
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
