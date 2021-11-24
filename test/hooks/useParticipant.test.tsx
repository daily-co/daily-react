/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useParticipant } from '../../src/hooks/useParticipant';

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useParticipant', () => {
  it('returns participant identified by given session_id', async () => {
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
    const { result, waitFor } = renderHook(() => useParticipant('a'), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual({
        session_id: 'a',
        user_name: 'Alpha',
      });
    });
  });
  describe('active-speaker-change event', () => {
    it('sets last_active on matching participant', async () => {
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
      const { result, waitFor } = renderHook(() => useParticipant('a'), {
        wrapper: createWrapper(daily),
      });
      const event: DailyEvent = 'active-speaker-change';
      const payload: DailyEventObjectActiveSpeakerChange = {
        action: event,
        activeSpeaker: {
          peerId: 'a',
        },
      };
      act(() => {
        // @ts-ignore
        daily.emit(event, payload);
      });
      await waitFor(() => {
        expect(result.current).toEqual({
          last_active: expect.any(Date),
          session_id: 'a',
          user_name: 'Alpha',
        });
      });
    });
    it('does not set last_active on non-matching participant', async () => {
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
      const { result, waitFor } = renderHook(() => useParticipant('a'), {
        wrapper: createWrapper(daily),
      });
      const event: DailyEvent = 'active-speaker-change';
      const payload: DailyEventObjectActiveSpeakerChange = {
        action: event,
        activeSpeaker: {
          peerId: 'b',
        },
      };
      act(() => {
        // @ts-ignore
        daily.emit(event, payload);
      });
      await waitFor(() => {
        expect(result.current).toEqual({
          session_id: 'a',
          user_name: 'Alpha',
        });
        expect(result.current).not.toHaveProperty('last_active');
      });
    });
  });
  it('participant-updated event updates participant and calls onParticipantUpdated', async () => {
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
    const onParticipantUpdated = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipant('a', { onParticipantUpdated }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'participant-updated';
    const payload: DailyEventObjectParticipant = {
      action: event,
      // @ts-ignore
      participant: {
        session_id: 'a',
        user_name: 'Beta',
      },
    };
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        session_id: 'local',
        user_name: '',
      },
      a: {
        session_id: 'a',
        user_name: 'Beta',
      },
    }));
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual({
        session_id: 'a',
        user_name: 'Beta',
      });
      expect(onParticipantUpdated).toBeCalledWith(payload);
    });
  });
  it('participant-left event resets participant and calls onParticipantLeft', async () => {
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
    const onParticipantLeft = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipant('a', { onParticipantLeft }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'participant-left';
    const payload: DailyEventObjectParticipant = {
      action: event,
      // @ts-ignore
      participant: {
        session_id: 'a',
        user_name: 'Alpha',
      },
    };
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        session_id: 'local',
        user_name: '',
      },
    }));
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
      expect(onParticipantLeft).toBeCalledWith(payload);
    });
  });
});
