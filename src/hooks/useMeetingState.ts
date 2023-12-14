import { DailyMeetingState } from '@daily-co/daily-js';
import { useDebugValue } from 'react';
import { useRecoilValue } from 'recoil';

import { meetingStateState } from '../DailyMeeting';

/**
 * Returns a meeting's current state.
 */
export const useMeetingState = (): DailyMeetingState | null => {
  const meetingState = useRecoilValue(meetingStateState);
  useDebugValue(meetingState);
  return meetingState;
};
