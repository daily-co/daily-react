import { DailyParticipant } from '@daily-co/daily-js';
import { useRecoilValue } from 'recoil';

import { participantPropertyState } from '../DailyParticipants';
import { NestedKeyOf } from '../types/util';

/**
 * Returns a participant's property that you subscribe to.
 * @param participantId The participant's session_id.
 * @param propertyPath the participant property that you want to subscribe to.
 */
export const useParticipantProperty = (
  participantId: string,
  propertyPath: NestedKeyOf<DailyParticipant>
) => {
  return useRecoilValue(
    participantPropertyState({ id: participantId, property: propertyPath })
  );
};
