import { DailyMeetingState } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useDebugValue } from 'react';

import { meetingStateState } from '../DailyMeeting';

/**
 * Returns a meeting's current state.
 */
export const useMeetingState = (): DailyMeetingState | null => {
  const meetingState = useAtomValue(meetingStateState);
  useDebugValue(meetingState);
  return meetingState;
};
