import { DailyEventObjectActiveSpeakerChange } from '@daily-co/daily-js';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useParticipant } from './useParticipant';

const activeIdState = atom<string>({
  key: 'active-id',
  default: '',
});

interface UseActiveParticipantArgs {
  /**
   * If set to true, useActiveParticipant will never return the local participant.
   */
  ignoreLocal?: boolean;
  onActiveSpeakerChange?(ev: DailyEventObjectActiveSpeakerChange): void;
}

/**
 * Returns the most recent participant mentioned in an 'active-speaker-change' event.
 */
export const useActiveParticipant = ({
  ignoreLocal = false,
  onActiveSpeakerChange,
}: UseActiveParticipantArgs = {}) => {
  const daily = useDaily();
  const activeId = useRecoilValue(activeIdState);
  const activeParticipant = useParticipant(activeId);

  useDailyEvent(
    'active-speaker-change',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectActiveSpeakerChange) => {
          const local = daily?.participants()?.local;
          if (ignoreLocal && ev.activeSpeaker.peerId === local?.session_id)
            return;
          set(activeIdState, ev.activeSpeaker.peerId);
          onActiveSpeakerChange?.(ev);
        },
      [daily, ignoreLocal, onActiveSpeakerChange]
    )
  );

  return activeParticipant;
};
