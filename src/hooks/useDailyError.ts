import { useDebugValue } from 'react';
import { useRecoilValue } from 'recoil';

import { meetingErrorState, nonFatalErrorState } from '../DailyMeeting';

/**
 * Returns a meeting's last known errors.
 */
export const useDailyError = () => {
  const meetingError = useRecoilValue(meetingErrorState);
  const nonFatalError = useRecoilValue(nonFatalErrorState);
  const result = {
    meetingError,
    nonFatalError,
  };
  useDebugValue(result);
  return result;
};
