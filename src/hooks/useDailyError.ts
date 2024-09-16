import { useAtomValue } from 'jotai';
import { useDebugValue } from 'react';

import { meetingErrorState, nonFatalErrorState } from '../DailyMeeting';

/**
 * Returns a meeting's last known errors.
 */
export const useDailyError = () => {
  const meetingError = useAtomValue(meetingErrorState);
  const nonFatalError = useAtomValue(nonFatalErrorState);
  const result = {
    meetingError,
    nonFatalError,
  };
  useDebugValue(result);
  return result;
};
