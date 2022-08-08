import { useRecoilValue } from 'recoil';

import {
  ExtendedDailyParticipant,
  participantPropertyState,
} from '../DailyParticipants';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';

/**
 * Returns a participant's property that you subscribe to.
 * @param participantId The participant's session_id.
 * @param propertyPath the participant property that you want to subscribe to.
 */
export const useParticipantProperty = <
  T extends ExtendedDailyParticipant,
  ID extends string,
  P extends Paths<T>
>(
  participantId: ID,
  propertyPath: P
): PathValue<T, P> | null => {
  return useRecoilValue(
    participantPropertyState({
      id: participantId,
      property: propertyPath as Paths<ExtendedDailyParticipant>,
    })
  );
};
