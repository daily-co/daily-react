import { DailyRoomInfo } from '@daily-co/daily-js';
import React from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';

export const roomState = atom<DailyRoomInfo | null>({
  key: 'room',
  default: null,
});

export const DailyRoom: React.FC = ({ children }) => {
  const daily = useDaily();

  const updateRoom = useRecoilCallback(
    ({ set }) =>
      async () => {
        if (!daily || daily.meetingState() === 'left-meeting') return;
        const room = await daily.room();
        if (room && 'id' in room) {
          set(roomState, room);
        }
        return room;
      },
    [daily]
  );

  useDailyEvent('access-state-updated', updateRoom);

  return <>{children}</>;
};
