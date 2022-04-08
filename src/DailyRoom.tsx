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
    if (!daily) return;

    let accessStateInterval: ReturnType<typeof setInterval>;
    const handleAccessStateUpdated = () => {
      accessStateInterval = setInterval(async () => {
        const room = await updateRoom();
        if (room && 'config' in room) {
          clearInterval(accessStateInterval);
        }
      }, 250);
    };
    let joiningInterval: ReturnType<typeof setInterval>;
    const handleJoining = () => {
      clearInterval(accessStateInterval);
      joiningInterval = setInterval(async () => {
        const room = await updateRoom();
        if (room && 'config' in room) {
          clearInterval(joiningInterval);
        }
      }, 250);
    };

    updateRoom();
    daily.on('access-state-updated', handleAccessStateUpdated);
    daily.on('joining-meeting', handleJoining);
    return () => {
      daily.off('access-state-updated', handleAccessStateUpdated);
      daily.off('joining-meeting', handleJoining);
    };
  }, [daily, updateRoom]);

  return <>{children}</>;
};
