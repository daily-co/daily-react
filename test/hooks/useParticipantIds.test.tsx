/// <reference types="@types/jest" />

import Daily, { DailyCall } from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useParticipantIds } from '../../src/hooks/useParticipantIds';
import {
  emitActiveSpeakerChange,
  emitJoinedMeeting,
  emitLeftMeeting,
  emitParticipantJoined,
  emitParticipantLeft,
  emitParticipantUpdated,
} from '../.test-utils/event-emitter';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
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
  (callObject: DailyCall = Daily.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useParticipantIds', () => {
  it('returns ids of participants', async () => {
    const daily = Daily.createCallObject();
    const { result, waitFor } = renderHook(() => useParticipantIds(), {
      wrapper: createWrapper(daily),
    });
    act(() =>
      emitJoinedMeeting(daily, {
        local: {
          session_id: 'local',
        },
        a: {
          session_id: 'a',
        },
        b: {
          session_id: 'b',
        },
      })
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a', 'b']);
    });
  });
  describe('filter', () => {
    it('local filter returns local id only', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: 'local',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['local']);
      });
    });
    it('remote filter returns remote ids only', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: 'remote',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'b']);
      });
    });
    it('owner filter returns owner ids only', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: 'owner',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a']);
      });
    });
    it('custom filter returns expected results', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            filter: (p) => p.session_id.includes('a'),
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['local', 'a']);
      });
    });
  });
  describe('sort', () => {
    it('sort by joined_at returns ordered ids', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'joined_at',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'local', 'b']);
      });
    });
    it('sort by session_id returns ordered ids', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'session_id',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
          local: {
            session_id: 'local',
          },
          a: {
            session_id: 'a',
          },
          b: {
            session_id: 'b',
          },
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'b', 'local']);
      });
    });
    it('sort by user_id returns ordered ids', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'user_id',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['b', 'a', 'local']);
      });
    });
    it('sort by user_name returns ordered ids', async () => {
      const daily = Daily.createCallObject();
      const { result, waitFor } = renderHook(
        () =>
          useParticipantIds({
            sort: 'user_name',
          }),
        {
          wrapper: createWrapper(daily),
        }
      );
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['a', 'local', 'b', 'c']);
      });
    });
    it('custom sort returns ordered ids', async () => {
      const daily = Daily.createCallObject();
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
      act(() =>
        emitJoinedMeeting(daily, {
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
        })
      );
      await waitFor(() => {
        expect(result.current).toEqual(['local', 'b', 'a']);
      });
    });
  });
  it('joined-meeting adds local participant to array', async () => {
    const daily = Daily.createCallObject();
    const { result, waitFor } = renderHook(() => useParticipantIds(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
    act(() =>
      emitJoinedMeeting(daily, {
        local: {
          local: true,
          session_id: 'local',
        },
      })
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local']);
    });
  });
  it('participant-joined adds id and calls onParticipantJoined', async () => {
    const daily = Daily.createCallObject();
    const onParticipantJoined = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onParticipantJoined }),
      {
        wrapper: createWrapper(daily),
      }
    );
    act(() =>
      emitJoinedMeeting(daily, {
        local: {
          local: true,
          session_id: 'local',
        },
      })
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local']);
    });
    const participant = {
      local: false,
      session_id: 'a',
    };
    act(() => emitParticipantJoined(daily, participant));
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
    });
    expect(onParticipantJoined).toBeCalledWith(
      expect.objectContaining({
        participant,
      })
    );
  });
  it('participant-updated calls onParticipantUpdated', async () => {
    const daily = Daily.createCallObject();
    const onParticipantUpdated = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onParticipantUpdated }),
      {
        wrapper: createWrapper(daily),
      }
    );
    act(() =>
      emitJoinedMeeting(daily, {
        local: {
          local: true,
          session_id: 'local',
          user_name: 'Gamma',
        },
      })
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local']);
    });
    const participant = {
      local: true,
      session_id: 'local',
      user_name: 'Zeta',
    };
    act(() => emitParticipantUpdated(daily, participant));
    await waitFor(() => {
      expect(onParticipantUpdated).toBeCalledWith(
        expect.objectContaining({
          participant,
        })
      );
    });
  });
  it('active-speaker-change calls onActiveSpeakerChange', async () => {
    const daily = Daily.createCallObject();
    const onActiveSpeakerChange = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onActiveSpeakerChange }),
      {
        wrapper: createWrapper(daily),
      }
    );
    act(() =>
      emitJoinedMeeting(daily, {
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
      })
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
    });
    act(() => emitActiveSpeakerChange(daily, 'a'));
    await waitFor(() => {
      expect(onActiveSpeakerChange).toBeCalledWith(
        expect.objectContaining({
          activeSpeaker: {
            peerId: 'a',
          },
        })
      );
    });
  });
  it('participant-left removes id and calls onParticipantLeft', async () => {
    const daily = Daily.createCallObject();
    const onParticipantLeft = jest.fn();
    const { result, waitFor } = renderHook(
      () => useParticipantIds({ onParticipantLeft }),
      {
        wrapper: createWrapper(daily),
      }
    );
    act(() =>
      emitJoinedMeeting(daily, {
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
      })
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
    });
    const participant = {
      local: false,
      session_id: 'a',
      user_name: 'Alpha',
    };
    act(() => emitParticipantLeft(daily, participant));
    await waitFor(() => {
      expect(result.current).toEqual(['local']);
      expect(onParticipantLeft).toBeCalledWith(
        expect.objectContaining({
          participant,
        })
      );
    });
  });
  it('left-meeting removes all ids', async () => {
    const daily = Daily.createCallObject();
    const { result, waitFor } = renderHook(() => useParticipantIds(), {
      wrapper: createWrapper(daily),
    });
    act(() =>
      emitJoinedMeeting(daily, {
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
      })
    );
    await waitFor(() => {
      expect(result.current).toEqual(['local', 'a']);
    });
    act(() => emitLeftMeeting(daily));
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});
