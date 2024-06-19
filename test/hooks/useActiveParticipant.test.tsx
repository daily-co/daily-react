/// <reference types="@types/jest" />
import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectActiveSpeakerChange,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useActiveParticipant } from '../../src/hooks/useActiveParticipant';
import { mockEvent } from '../.test-utils/mocks';

jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useActiveParticipant', () => {
  it('returns null by default', async () => {
    const daily = Daily.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        session_id: 'local',
        user_name: '',
      },
      a: {
        session_id: 'a',
        user_name: 'Alpha',
      },
    }));
    const { result } = renderHook(() => useActiveParticipant(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  describe('active-speaker-change event', () => {
    it('changes returned participant (local) and calls onActiveSpeakerChange', async () => {
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          session_id: 'local',
          user_name: '',
        },
        a: {
          session_id: 'a',
          user_name: 'Alpha',
        },
      }));
      const onActiveSpeakerChange = jest.fn();
      const { result } = renderHook(
        () => useActiveParticipant({ onActiveSpeakerChange }),
        {
          wrapper: createWrapper(daily),
        }
      );
      const event: DailyEvent = 'active-speaker-change';
      const payload: DailyEventObjectActiveSpeakerChange = mockEvent({
        action: event,
        activeSpeaker: {
          peerId: 'local',
        },
      });
      act(() => {
        // @ts-ignore
        daily.emit(event, payload);
      });
      await waitFor(() => {
        expect(result.current).toEqual({
          session_id: 'local',
          user_name: '',
        });
        expect(onActiveSpeakerChange).toBeCalledWith(payload);
      });
    });
    it('does not change returned participant, when ignoreLocal is set', async () => {
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          session_id: 'local',
          user_name: '',
        },
        a: {
          session_id: 'a',
          user_name: 'Alpha',
        },
      }));
      const { result } = renderHook(
        () =>
          useActiveParticipant({
            ignoreLocal: true,
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      const event: DailyEvent = 'active-speaker-change';
      const payload: DailyEventObjectActiveSpeakerChange = mockEvent({
        action: event,
        activeSpeaker: {
          peerId: 'local',
        },
      });
      act(() => {
        // @ts-ignore
        daily.emit(event, payload);
      });
      await waitFor(() => {
        expect(result.current).toEqual(null);
      });
    });
  });
});
