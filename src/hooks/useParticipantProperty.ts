import { useRecoilValue } from 'recoil';

import type { Paths } from '../../types/paths';
import type { PathValue } from '../../types/pathValues';
import {
  ExtendedDailyParticipant,
  participantPropertyState,
} from '../DailyParticipants';

/**
 * Returns a participant's property that you subscribe to.
 * @param participantId The participant's session_id.
 * @param propertyPath the participant property that you want to subscribe to.
 */
export const useParticipantProperty = (
  participantId: string,
  propertyPath: Paths<ExtendedDailyParticipant>
) => {
  return useRecoilValue(
    participantPropertyState({ id: participantId, property: propertyPath })
  ) as PathValue<
    ExtendedDailyParticipant,
    Paths<ExtendedDailyParticipant>
  > | null;
};
