/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectActiveSpeakerChange,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useActiveSpeakerId } from '../../src/hooks/useActiveSpeakerId';

jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useActiveSpeakerId', () => {
  it('returns null by default', async () => {
    const daily = DailyIframe.createCallObject();
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
    const { result, waitFor } = renderHook(() => useActiveSpeakerId(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  describe('active-speaker-change event', () => {
    it('changes returned participant session id (local)', async () => {
      const daily = DailyIframe.createCallObject();
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
      const { result, waitFor } = renderHook(() => useActiveSpeakerId(), {
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
      const daily = DailyIframe.createCallObject();
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
      const { result, waitFor } = renderHook(
        () =>
          useActiveSpeakerId({
            ignoreLocal: true,
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
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
        expect(result.current).toEqual(null);
      });
    });
  });
});
