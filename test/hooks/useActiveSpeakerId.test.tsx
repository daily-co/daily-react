/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectActiveSpeakerChange,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useActiveSpeakerId } from '../../src/hooks/useActiveSpeakerId';
import {
  emitActiveSpeakerChange,
  emitJoinedMeeting,
} from '../.test-utils/event-emitter';
import { mockParticipant } from '../.test-utils/mocks';

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

describe('useActiveSpeakerId', () => {
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
    const { result } = renderHook(() => useActiveSpeakerId(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  describe('active-speaker-change event', () => {
    it('changes returned participant session id (local)', async () => {
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
      const { result } = renderHook(() => useActiveSpeakerId(), {
        wrapper: createWrapper(daily),
      });
      const event: DailyEvent = 'active-speaker-change';
      const payload: DailyEventObjectActiveSpeakerChange = {
        action: event,
        activeSpeaker: {
          peerId: 'local',
        },
      };
      act(() => {
        // @ts-ignore
        daily.emit(event, payload);
      });
      await waitFor(() => {
        expect(result.current).toEqual('local');
      });
    });
    it('does not change returned participant, when ignoreLocal is set', async () => {
      const daily = Daily.createCallObject();
      const local = mockParticipant({
        local: true,
        session_id: 'local',
        user_name: '',
      });
      const a = mockParticipant({
        local: false,
        session_id: 'a',
        user_name: 'Alpha',
      });
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local,
        a,
      }));
      const { result } = renderHook(
        () =>
          useActiveSpeakerId({
            ignoreLocal: true,
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() => {
        emitJoinedMeeting(daily, {
          local,
          a,
        });
      });
      act(() => {
        emitActiveSpeakerChange(daily, local.session_id);
      });
      await waitFor(() => {
        expect(result.current).toEqual(null);
      });
    });
  });
});
