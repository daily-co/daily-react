import { useAtomValue } from 'jotai';
import { useDebugValue } from 'react';

import { meetingSessionSummaryState } from '../DailyMeeting';

/**
 * Returns the current meeting session summary, as returned by
 * `meetingSessionSummary()`. Contains the meeting session's `id` once the
 * session has started, or `null` before then.
 *
 * The session `id` is useful for correlating a call with recordings, logs and
 * REST API resources.
 */
export const useMeetingSessionSummary = () => {
  const meetingSessionSummary = useAtomValue(meetingSessionSummaryState);
  useDebugValue(meetingSessionSummary);
  return meetingSessionSummary;
};
