import { DailyParticipant } from '@daily-co/daily-js';
import { useRecoilValue } from 'recoil';

import { participantPropertyState } from '../DailyParticipants';

/**
 * Returns a participant's property that you subscribe to.
 * @param participantId The participant's session_id.
 * @param propertyPath the participant property that you want to subscribe to.
 */
export const useParticipantProperty = (
  participantId: string,
  propertyPath: keyof DailyParticipant
) => {
  return useRecoilValue(
    participantPropertyState({ id: participantId, property: propertyPath })
  );
};
