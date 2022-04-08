/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useParticipantIds } from '../../src/hooks/useParticipantIds';

jest.mock('../../src/DailyRoom', () => ({
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useParticipantIds', () => {
  it('returns ids of participants', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        session_id: 'local',
      },
      a: {
        session_id: 'a',
      },
      b: {
        session_id: 'b',
      },
    }));
    const { result, waitFor } = renderHook(() => useParticipantIds(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a', 'b']);
    });
  });
  describe('filter', () => {
    it('local filter returns local id only', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: 'local',
        },
        a: {
          local: false,
          session_id: 'a',
        },
        b: {
          local: false,
          session_id: 'b',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: 'local',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['local']);
      });
    });
    it('remote filter returns remote ids only', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: 'local',
        },
        a: {
          local: false,
          session_id: 'a',
        },
        b: {
          local: false,
          session_id: 'b',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: 'remote',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'b']);
      });
    });
    it('owner filter returns owner ids only', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          owner: false,
          session_id: 'local',
        },
        a: {
          owner: true,
          session_id: 'a',
        },
        b: {
          owner: false,
          session_id: 'b',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: 'owner',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a']);
      });
    });
    it('custom filter returns expected results', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          owner: false,
          session_id: 'local',
        },
        a: {
          local: false,
          owner: true,
          session_id: 'a',
        },
        b: {
          local: false,
          owner: false,
          session_id: 'b',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: (p) => p.session_id.includes('a'),
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['local', 'a']);
      });
    });
  });
  describe('sort', () => {
    it('sort by joined_at returns ordered ids', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          joined_at: new Date('2021-11-24T15:19:00.000'),
          session_id: 'local',
        },
        a: {
          joined_at: new Date('2021-11-24T15:14:00.000'),
          session_id: 'a',
        },
        b: {
          joined_at: new Date('2021-11-24T15:24:00.000'),
          session_id: 'b',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'joined_at',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'local', 'b']);
      });
    });
    it('sort by session_id returns ordered ids', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          session_id: 'local',
        },
        a: {
          session_id: 'a',
        },
        b: {
          session_id: 'b',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'session_id',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'b', 'local']);
      });
    });
    it('sort by user_id returns ordered ids', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          session_id: 'local',
          user_id: '3',
        },
        a: {
          session_id: 'a',
          user_id: '2',
        },
        b: {
          session_id: 'b',
          user_id: '1',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'user_id',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['b', 'a', 'local']);
      });
    });
    it('sort by user_name returns ordered ids', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          session_id: 'local',
          user_name: 'Beta',
        },
        a: {
          session_id: 'a',
          user_name: 'Alpha',
        },
        b: {
          session_id: 'b',
          user_name: 'Gamma',
        },
        c: {
          session_id: 'c',
          user_name: 'Gamma',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'user_name',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'local', 'b', 'c']);
      });
    });
    it('custom sort returns ordered ids', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: 'local',
          user_name: 'Beta',
        },
        a: {
          local: false,
          session_id: 'a',
          user_name: 'Gamma',
        },
        b: {
          local: false,
          session_id: 'b',
          user_name: 'Alpha',
        },
      }));
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: (a, b) => {
              if (a.local || b.local) return 1;
              if (a.user_name < b.user_name) return -1;
              if (a.user_name > b.user_name) return 1;
              return 0;
            },
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current).toEqual(['local', 'b', 'a']);
      });
    });
  });
  it('joined-meeting adds local participant to array', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
      },
    }));
    const { result, waitFor } = renderHook(() => useParticipantIds(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'joined-meeting';
    const payload: DailyEventObjectParticipants = {
      action: event,
      participants: {
        // @ts-ignore
        local: {
          local: true,
          session_id: 'local',
        },
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual(['local']);
    });
  });
  it('participant-joined adds new participant to array and calls onParticipantJoined', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
      },
    }));
    const onParticipantJoined = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onParticipantJoined }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'participant-joined';
    const payload: DailyEventObjectParticipant = {
      action: event,
      // @ts-ignore
      participant: {
        local: false,
        session_id: 'a',
      },
    };
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
      },
      a: {
        local: false,
        session_id: 'a',
      },
    }));
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
      expect(onParticipantJoined).toBeCalledWith(payload);
    });
  });
  it('participant-updated reconciles array of ids and calls onParticipantUpdated', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: 'Gamma',
      },
      a: {
        local: false,
        session_id: 'a',
        user_name: 'Alpha',
      },
    }));
    const onParticipantUpdated = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onParticipantUpdated, sort: 'user_name' }),
      {
        wrapper: createWrapper(daily),
      }
    );
    await waitFor(() => {
      expect(result.current).toEqual(['a', 'local']);
    });
    const event: DailyEvent = 'participant-updated';
    const payload: DailyEventObjectParticipant = {
      action: event,
      // @ts-ignore
      participant: {
        local: false,
        session_id: 'a',
        user_name: 'Zeta',
      },
    };
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: 'Gamma',
      },
      a: {
        local: false,
        session_id: 'a',
        user_name: 'Zeta',
      },
    }));
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
      expect(onParticipantUpdated).toBeCalledWith(payload);
    });
  });
  it('active-speaker-change calls onActiveSpeakerChange', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: 'Gamma',
      },
      a: {
        local: false,
        session_id: 'a',
        user_name: 'Alpha',
      },
    }));
    const onActiveSpeakerChange = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onActiveSpeakerChange }),
      {
        wrapper: createWrapper(daily),
      }
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
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
      expect(onActiveSpeakerChange).toBeCalledWith(payload);
    });
  });
  it('participant-left removes id and calls onParticipantLeft', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: 'Gamma',
      },
      a: {
        local: false,
        session_id: 'a',
        user_name: 'Alpha',
      },
    }));
    const onParticipantLeft = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onParticipantLeft }),
      {
        wrapper: createWrapper(daily),
      }
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
    });
    const event: DailyEvent = 'participant-left';
    const payload: DailyEventObjectParticipant = {
      action: event,
      // @ts-ignore
      participant: {
        local: false,
        session_id: 'a',
        user_name: 'Alpha',
      },
    };
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: 'Gamma',
      },
    }));
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual(['local']);
      expect(onParticipantLeft).toBeCalledWith(payload);
    });
  });
});
