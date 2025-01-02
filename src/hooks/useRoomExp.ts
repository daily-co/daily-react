import { useAtomValue } from 'jotai';
import { useDebugValue, useEffect, useState } from 'react';

import { localJoinDateState } from '../DailyParticipants';
import { useRoom } from './useRoom';

interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
}

interface Props {
  onCountdown?(countdown: Countdown): void;
}

export const useRoomExp = ({ onCountdown }: Props = {}) => {
  const localJoinDate = useAtomValue(localJoinDateState);
  const room = useRoom();

  const [ejectDate, setEjectDate] = useState<Date | null>(null);

  useEffect(() => {
    const expCandidates: number[] = [];

    const ejectAfterElapsed =
      room?.tokenConfig?.eject_after_elapsed ??
      room?.config?.eject_after_elapsed ??
      0;

    if (ejectAfterElapsed && localJoinDate) {
      expCandidates.push(localJoinDate.getTime() + 1000 * ejectAfterElapsed);
    }
    if (room?.tokenConfig?.exp && room?.tokenConfig?.eject_at_token_exp) {
      expCandidates.push(room.tokenConfig.exp * 1000);
    }
    if (room?.config?.exp && room?.config?.eject_at_room_exp) {
      expCandidates.push(room.config.exp * 1000);
    }

    const newEjectDate =
      expCandidates.length > 0
        ? new Date(Math.min(...expCandidates))
        : new Date(0);

    if (newEjectDate.getTime() === 0) return;

    setEjectDate((oldEjectDate) =>
      oldEjectDate?.getTime() !== newEjectDate.getTime()
        ? newEjectDate
        : oldEjectDate
    );
  }, [
    localJoinDate,
    room?.config?.eject_after_elapsed,
    room?.config?.eject_at_room_exp,
    room?.config?.exp,
    room?.tokenConfig?.eject_after_elapsed,
    room?.tokenConfig?.eject_at_token_exp,
    room?.tokenConfig?.exp,
  ]);

  useEffect(() => {
    if (!ejectDate || ejectDate.getTime() === 0) return;

    const interval = setInterval(() => {
      const eject = (ejectDate?.getTime() ?? 0) / 1000;
      const now = Date.now() / 1000;
      const diff = eject - now;
      if (diff < 0) return;
      const hours = Math.max(0, Math.floor(diff / 3600));
      const minutes = Math.max(0, Math.floor((diff % 3600) / 60));
      const seconds = Math.max(0, Math.floor(diff % 60));
      onCountdown?.({
        hours,
        minutes,
        seconds,
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [ejectDate, onCountdown]);

  const result = {
    ejectDate,
  };

  useDebugValue(result);

  return result;
};
