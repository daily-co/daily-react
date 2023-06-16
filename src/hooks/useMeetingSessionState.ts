import { useRecoilValue } from 'recoil';

import { meetingSessionDataState } from '../DailyMeeting';

/**
 * Returns a meeting's current session data and topology.
 */
export const useMeetingSessionState = <T = any>() => {
  const meetingSessionState = useRecoilValue(meetingSessionDataState);
  return {
    data: meetingSessionState?.data as T,
    topology: meetingSessionState?.topology,
  };
};
