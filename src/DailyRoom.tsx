import { DailyPendingRoomInfo, DailyRoomInfo } from '@daily-co/daily-js';
import React, { useEffect } from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';

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
        const room = await daily.room();
        set(roomState, room);
        return room;
      },
    [daily]
  );

  /**
   * TODO: This is a workaround due to the lack of a dedicated event to listen for
   * when a room configuration is available.
   * The closest event to listen for is the access-state-updated event,
   * unfortunately daily.room() doesn't immediately return the room config,
   * when this event is emitted.
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      const room = updateRoom();
      if ('config' in room) {
        clearInterval(interval);
      }
    }, 250);
    return () => {
      clearInterval(interval);
    };
  }, [updateRoom]);

  return <>{children}</>;
};
