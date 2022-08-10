import { useRecoilValue } from 'recoil';

import {
  ExtendedDailyParticipant,
  participantPropertyState,
} from '../DailyParticipants';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';

type UseParticipantPropertyReturnType<
  T extends ExtendedDailyParticipant,
  P extends Paths<T> | Paths<T>[]
> = P extends Paths<T>[]
  ? { [K in keyof P]-?: K extends number ? PathValue<T, P[K]> : never }
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
  P extends Paths<T> | Paths<T>[]
>(
  participantId: string,
  propertyPaths: P
): UseParticipantPropertyReturnType<T, P> => {
  const participantProperties = useRecoilValue(
    participantPropertyState({
      id: participantId,
      properties: (Array.isArray(propertyPaths)
        ? propertyPaths
        : [propertyPaths]) as Paths<ExtendedDailyParticipant>[],
    })
  );

  return Array.isArray(propertyPaths)
    ? participantProperties
    : participantProperties[0];
};
