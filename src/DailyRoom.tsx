import { DailyRoomInfo } from '@daily-co/daily-js';
import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback } from 'react';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { useMeetingState } from './hooks/useMeetingState';
import { jotaiDebugLabel } from './lib/jotai-custom';

export const roomState = atom<DailyRoomInfo | null>(null);
roomState.debugLabel = jotaiDebugLabel('room-state');

export const DailyRoom: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const daily = useDaily();
  const meetingState = useMeetingState();

  const updateRoom = useAtomCallback(
    useCallback(
      async (_get, set) => {
        if (!daily || meetingState === 'left-meeting') return;
        const room = await daily.room();
        if (room && 'id' in room) {
          set(roomState, room);
        }
        return room;
      },
      [daily, meetingState]
    )
  );

  useDailyEvent('access-state-updated', updateRoom);

  useDailyEvent(
    'left-meeting',
    useAtomCallback(
      useCallback(
        (_get, set) => () => {
          set(roomState, null);
        },
        []
      )
    )
  );

  return <>{children}</>;
};
