import { DailyMeetingState } from '@daily-co/daily-js';
import { useRecoilValue } from 'recoil';

import { meetingStateState } from '../DailyMeeting';

/**
 * Returns a meeting's current state.
 */
export const useMeetingState = (): DailyMeetingState | null => {
  const meetingState = useRecoilValue(meetingStateState);
  return meetingState;
};
