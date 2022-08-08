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
 * @param propertyPaths the array of participant property that you want to subscribe to.
 */
export const useParticipantProperty = <
  T extends ExtendedDailyParticipant,
  P extends Paths<T>
>(
  participantId: string,
  propertyPaths: P[]
): { [K in P]: PathValue<T, K> } => {
  return useRecoilValue(
    participantPropertyState({
      id: participantId,
      properties: propertyPaths as Paths<ExtendedDailyParticipant>[],
    })
  );
};
