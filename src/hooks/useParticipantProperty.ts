import { useCallback, useEffect, useState } from 'react';
import {
  selectorFamily,
  useRecoilCallback,
  useRecoilTransactionObserver_UNSTABLE,
} from 'recoil';

import {
  ExtendedDailyParticipant,
  participantState,
} from '../DailyParticipants';
import { RECOIL_PREFIX } from '../lib/constants';
import { customDeepEqual } from '../lib/customDeepEqual';
import type { NumericKeys } from '../types/NumericKeys';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';
import { resolveParticipantPaths } from '../utils/resolveParticipantPaths';
import { useDaily } from './useDaily';

type PropertyType = {
  id: string;
  properties: Paths<ExtendedDailyParticipant>[];
};

/**
 * Stores resolved values for each participant and property path.
 */
export const participantPropertyState = selectorFamily<any, PropertyType>({
  key: RECOIL_PREFIX + 'participant-property',
  get:
    ({ id, properties }) =>
    ({ get }) => {
      const participant = get(participantState(id));
      return resolveParticipantPaths(participant, properties);
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
  T extends ExtendedDailyParticipant,
  P extends Paths<T> | [Paths<T>, ...Paths<T>[]]
>(
  participantId: string,
  propertyPaths: P
): UseParticipantPropertyReturnType<T, P> => {
  const daily = useDaily();
  let initialValues: any[] = [];
  if (daily && !daily.isDestroyed()) {
    const participant = Object.values(daily.participants()).find(
      (p) => p.session_id === participantId
    );
    if (participant) {
      initialValues = resolveParticipantPaths(
        participant as T,
        (Array.isArray(propertyPaths)
          ? propertyPaths
          : [propertyPaths]) as Paths<T>[]
      );
    }
  }
  const [properties, setProperties] = useState<any[]>(initialValues);

  /**
   * Updates properties state, in case the passed list of values differs to what's currently in state.
   */
  const maybeUpdateProperties = useCallback((properties: any[]) => {
    setProperties((prevProperties) => {
      if (customDeepEqual(properties, prevProperties)) return prevProperties;
      return properties;
    });
  }, []);

  /**
   * Used to initialize the properties state, when the component mounts,
   * or the parameters change.
   */
  const initProperties = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const properties = await snapshot.getPromise(
          participantPropertyState({
            id: participantId,
            properties: (Array.isArray(propertyPaths)
              ? propertyPaths
              : [propertyPaths]) as Paths<ExtendedDailyParticipant>[],
          })
        );
        maybeUpdateProperties(properties);
      },
    [maybeUpdateProperties, participantId, propertyPaths]
  );

  /**
   * Effect to initialize state when mounted.
   */
  useEffect(() => {
    initProperties();
  }, [initProperties]);

  /**
   * Asynchronously subscribes to updates to the participantPropertyState, without causing re-renders.
   * Anytime the recoil state returns a different list, we'll update this hook instance's state.
   */
  useRecoilTransactionObserver_UNSTABLE(async ({ snapshot }) => {
    const properties = await snapshot.getPromise(
      participantPropertyState({
        id: participantId,
        properties: (Array.isArray(propertyPaths)
          ? propertyPaths
          : [propertyPaths]) as Paths<ExtendedDailyParticipant>[],
      })
    );
    maybeUpdateProperties(properties);
  });

  return Array.isArray(propertyPaths) ? properties : properties[0];
};
