/// <reference types="@types/jest" />

import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { act, render, waitFor } from '@testing-library/react';
import faker from 'faker';
import React from 'react';

import { DailyAudio } from '../../src/components/DailyAudio';
import { DailyProvider } from '../../src/DailyProvider';

const localSessionId = faker.datatype.uuid();

jest.mock('../../src/hooks/useLocalSessionId', () => ({
  useLocalSessionId: () => localSessionId,
}));
jest.mock('../../src/DailyDevices', () => ({
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

// Inits DailyParticipants and useParticipantIds
const emitStartedCamera = (callObject: DailyCall) => {
  // @ts-ignore
  callObject.emit('started-camera', {
    action: 'started-camera',
  });
};
const emitActiveSpeakerChange = (callObject: DailyCall, peerId: string) => {
  // @ts-ignore
  callObject.emit('active-speaker-change', {
    action: 'active-speaker-change',
    activeSpeaker: {
      peerId,
    },
  });
};
const emitTrackStarted = (callObject: DailyCall, peerId: string) => {
  // @ts-ignore
  callObject.emit('track-started', {
    action: 'track-started',
    participant: {
      local: peerId === localSessionId,
      session_id: peerId,
    },
    track: {
      kind: 'audio',
    },
  });
};
const emitParticipantLeft = (callObject: DailyCall, peerId: string) => {
  // @ts-ignore
  callObject.emit('participant-left', {
    action: 'participant-left',
    participant: {
      local: false,
      session_id: peerId,
    },
  });
};

describe('DailyAudio', () => {
  it.each([1, 3, 5])('renders maxSpeakers audio tags (%i)', (maxSpeakers) => {
    const Wrapper = createWrapper();
    const { container } = render(
      <Wrapper>
        <DailyAudio maxSpeakers={maxSpeakers} />
      </Wrapper>
    );
    expect(container.querySelectorAll('audio')).toHaveLength(maxSpeakers);
  });

  describe('active speaker', () => {
    it('assigns subscribed speaker to first free slot', async () => {
      const callObject = DailyIframe.createCallObject();
      const peerId = faker.datatype.uuid();
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
        },
        [peerId]: {
          local: false,
          session_id: peerId,
          tracks: {
            audio: {
              subscribed: true,
            },
          },
        },
      }));
      const Wrapper = createWrapper(callObject);
      const { container } = render(
        <Wrapper>
          <DailyAudio />
        </Wrapper>
      );
      act(() => emitStartedCamera(callObject));
      act(() => emitActiveSpeakerChange(callObject, peerId));
      await waitFor(() => {
        expect(
          container.querySelector(
            `audio[data-session-id="${peerId}"][data-audio-type="audio"]`
          )
        ).not.toBeNull();
      });
    });
    it('ignores unsubscribed speaker', async () => {
      const callObject = DailyIframe.createCallObject();
      const peerId = faker.datatype.uuid();
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
        },
        [peerId]: {
          local: false,
          session_id: peerId,
          tracks: {
            audio: {
              subscribed: false,
            },
          },
        },
      }));
      const Wrapper = createWrapper(callObject);
      const { container } = render(
        <Wrapper>
          <DailyAudio />
        </Wrapper>
      );
      act(() => emitStartedCamera(callObject));
      act(() => emitActiveSpeakerChange(callObject, peerId));
      await waitFor(() => {
        expect(
          container.querySelector(
            `audio[data-session-id="${peerId}"][data-audio-type="audio"]`
          )
        ).toBeNull();
      });
    });
    it('ignores local participant', async () => {
      const callObject = DailyIframe.createCallObject();
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
        },
      }));
      const Wrapper = createWrapper(callObject);
      const { container } = render(
        <Wrapper>
          <DailyAudio />
        </Wrapper>
      );
      act(() => emitStartedCamera(callObject));
      act(() => emitActiveSpeakerChange(callObject, localSessionId));
      await waitFor(() => {
        expect(
          container.querySelector(
            `audio[data-session-id="${localSessionId}"][data-audio-type="audio"]`
          )
        ).toBeNull();
      });
    });
  });
  describe('unmuted participant', () => {
    it('assigns subscribed participant to first free slot', async () => {
      const callObject = DailyIframe.createCallObject();
      const peerId = faker.datatype.uuid();
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
        },
        [peerId]: {
          local: false,
          session_id: peerId,
          tracks: {
            audio: {
              subscribed: true,
            },
          },
        },
      }));
      const Wrapper = createWrapper(callObject);
      const { container } = render(
        <Wrapper>
          <DailyAudio />
        </Wrapper>
      );
      act(() => emitStartedCamera(callObject));
      act(() => emitTrackStarted(callObject, peerId));
      await waitFor(() => {
        expect(
          container.querySelector(
            `audio[data-session-id="${peerId}"][data-audio-type="audio"]`
          )
        ).not.toBeNull();
      });
    });
    it('ignores local participant', async () => {
      const callObject = DailyIframe.createCallObject();
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
        },
      }));
      const Wrapper = createWrapper(callObject);
      const { container } = render(
        <Wrapper>
          <DailyAudio />
        </Wrapper>
      );
      act(() => emitStartedCamera(callObject));
      act(() => emitTrackStarted(callObject, localSessionId));
      await waitFor(() => {
        expect(
          container.querySelector(
            `audio[data-session-id="${localSessionId}"][data-audio-type="audio"]`
          )
        ).toBeNull();
      });
    });
  });
  describe('left participant', () => {
    it('unassigns audio', async () => {
      const callObject = DailyIframe.createCallObject();
      const peerId = faker.datatype.uuid();
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
        },
        [peerId]: {
          local: false,
          session_id: peerId,
          tracks: {
            audio: {
              subscribed: true,
            },
          },
        },
      }));
      const Wrapper = createWrapper(callObject);
      const { container } = render(
        <Wrapper>
          <DailyAudio />
        </Wrapper>
      );
      act(() => emitStartedCamera(callObject));
      act(() => emitTrackStarted(callObject, peerId));
      await waitFor(() => {
        expect(
          container.querySelector(
            `audio[data-session-id="${peerId}"][data-audio-type="audio"]`
          )
        ).not.toBeNull();
      });
      act(() => emitParticipantLeft(callObject, peerId));
      await waitFor(() => {
        expect(
          container.querySelector(
            `audio[data-session-id="${peerId}"][data-audio-type="audio"]`
          )
        ).toBeNull();
      });
    });
  });
  describe('replacement logic', () => {});
});
