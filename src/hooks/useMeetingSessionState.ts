import { DailyEventObjectNonFatalError } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue } from 'react';

import { meetingSessionDataState } from '../DailyMeeting';
import { Reconstruct } from '../types/Reconstruct';
import { useDailyEvent } from './useDailyEvent';

type DailyEventObjectMeetingSessionDataError = Reconstruct<
  DailyEventObjectNonFatalError,
  'type',
  'meeting-session-data-error'
>;

interface Props {
  onError?(ev: DailyEventObjectMeetingSessionDataError): void;
}

/**
 * Returns a meeting's current session data and topology.
 */
export const useMeetingSessionState = <T = any>({ onError }: Props = {}) => {
  const meetingSessionState = useAtomValue(meetingSessionDataState);

  useDailyEvent(
    'nonfatal-error',
    useCallback(
      (ev) => {
        if (ev.type !== 'meeting-session-data-error') return;
        onError?.(ev as DailyEventObjectMeetingSessionDataError);
      },
      [onError]
    )
  );

  const result = {
    data: meetingSessionState?.data as T,
    topology: meetingSessionState?.topology,
  };

  useDebugValue(result);

  return result;
};
