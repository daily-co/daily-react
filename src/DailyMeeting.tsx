import { DailyMeetingState } from '@daily-co/daily-js';
import React from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { RECOIL_PREFIX } from './lib/constants';

export const meetingStateState = atom<DailyMeetingState | null>({
  key: RECOIL_PREFIX + 'meeting-state',
  default: null, // is this the right default?
});

export const DailyMeeting: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const daily = useDaily();

  const updateMeetingState = useRecoilCallback(
    ({ set }) =>
      () => {
        if (!daily) return;
        console.log('changing meeting state');
        const meetingState = daily.meetingState();
        set(meetingStateState, meetingState);
        return meetingState;
      },
    [daily]
  );

  useDailyEvent('loading', updateMeetingState);
  useDailyEvent('loaded', updateMeetingState);
  useDailyEvent('joining-meeting', updateMeetingState);
  useDailyEvent('joined-meeting', updateMeetingState);
  useDailyEvent('left-meeting', updateMeetingState);
  useDailyEvent('error', updateMeetingState);

  return <>{children}</>;
};
