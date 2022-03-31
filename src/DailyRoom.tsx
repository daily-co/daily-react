import { DailyPendingRoomInfo, DailyRoomInfo } from '@daily-co/daily-js';
import React from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';

export const roomState = atom<DailyPendingRoomInfo | DailyRoomInfo | null>({
  key: 'room',
  default: null,
});

export const DailyRoom: React.FC = ({ children }) => {
  const daily = useDaily();

  const updateRoom = useRecoilCallback(
    ({ set }) =>
      async () => {
        if (!daily) return;
        set(roomState, await daily.room());
      },
    [daily]
  );

  useDailyEvent('loading', updateRoom);
  useDailyEvent('loaded', updateRoom);
  useDailyEvent('access-state-updated', updateRoom);
  useDailyEvent('started-camera', updateRoom);
  useDailyEvent('joining-meeting', updateRoom);
  useDailyEvent('joined-meeting', updateRoom);

  return <>{children}</>;
};
