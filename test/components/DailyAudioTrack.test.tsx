/// <reference types="@types/jest" />
/// <reference types="@testing-library/jest-dom" />

import Daily, { DailyCall } from '@daily-co/daily-js';
import { faker } from '@faker-js/faker';
import { act, render, waitFor } from '@testing-library/react';
import { FakeMediaStreamTrack } from 'fake-mediastreamtrack';
import React from 'react';

import { DailyAudioTrack } from '../../src/components/DailyAudioTrack';
import { DailyProvider } from '../../src/DailyProvider';
import {
  emitLeftMeeting,
  emitParticipantJoined,
} from '../.test-utils/event-emitter';

jest.mock('../../src/DailyDevices', () => ({
  DailyDevices: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('DailyAudioTrack', () => {
  it('renders <audio> tag with expected attributes', () => {
    const Wrapper = createWrapper();
    const sessionId = faker.string.uuid();
    const { container } = render(
      <Wrapper>
        <DailyAudioTrack sessionId={sessionId} />
      </Wrapper>
    );
    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('autoplay');
    expect(audio).toHaveAttribute('data-audio-type', 'audio');
    expect(audio).toHaveAttribute('data-session-id', sessionId);
  });
  it('renders custom attributes to <audio> tag', () => {
    const Wrapper = createWrapper();
    const sessionId = faker.string.uuid();
    const attributes = {
      id: 'customId',
      'data-custom': 'value',
    };
    const { container } = render(
      <Wrapper>
        <DailyAudioTrack sessionId={sessionId} {...attributes} />
      </Wrapper>
    );
    const audio = container.querySelector('audio');
    for (let [key, val] of Object.entries(attributes)) {
      expect(audio).toHaveAttribute(key, val);
    }
  });
  it('assigns correct audio track to <audio> tag', async () => {
    const callObject = Daily.createCallObject();
    const Wrapper = createWrapper(callObject);
    const sessionId = faker.string.uuid();
    const track = new FakeMediaStreamTrack({ kind: 'audio' });
    (callObject.participants as jest.Mock).mockImplementation(() => ({
      [sessionId]: {
        local: false,
        session_id: sessionId,
        tracks: {
          audio: {
            persistentTrack: track,
            state: 'playable',
            track: track,
          },
        },
      },
    }));
    const { container } = render(
      <Wrapper>
        <DailyAudioTrack sessionId={sessionId} />
      </Wrapper>
    );
    act(() => {
      emitParticipantJoined(callObject, {
        local: false,
        session_id: sessionId,
        // @ts-ignore
        tracks: {
          audio: {
            persistentTrack: track,
            state: 'playable',
            subscribed: true,
            track: track,
          },
        },
      });
    });
    await waitFor(() => {
      expect(
        (
          container.querySelector('audio')?.srcObject as MediaStream
        )?.getAudioTracks()?.[0]?.id
      ).toEqual(track.id);
    });
  });
  it('calls load() and plays on loadedmetadata after srcObject swap', async () => {
    const loadSpy = jest
      .spyOn(HTMLMediaElement.prototype, 'load')
      .mockImplementation(() => {});
    const playSpy = jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue();
    try {
      const callObject = Daily.createCallObject();
      const Wrapper = createWrapper(callObject);
      const sessionId = faker.string.uuid();
      const track = new FakeMediaStreamTrack({ kind: 'audio' });
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        [sessionId]: {
          local: false,
          session_id: sessionId,
          tracks: {
            audio: {
              persistentTrack: track,
              state: 'playable',
              track: track,
            },
          },
        },
      }));
      const { container } = render(
        <Wrapper>
          <DailyAudioTrack sessionId={sessionId} />
        </Wrapper>
      );
      act(() => {
        emitParticipantJoined(callObject, {
          local: false,
          session_id: sessionId,
          // @ts-ignore
          tracks: {
            audio: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track: track,
            },
          },
        });
      });
      const audio = container.querySelector('audio');
      await waitFor(() => {
        expect(loadSpy).toHaveBeenCalled();
      });
      expect(playSpy).not.toHaveBeenCalled();
      act(() => {
        audio?.dispatchEvent(new Event('loadedmetadata'));
      });
      expect(playSpy).toHaveBeenCalledTimes(1);
    } finally {
      loadSpy.mockRestore();
      playSpy.mockRestore();
    }
  });
  it('pauses and clears srcObject on left-meeting', async () => {
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pauseSpy = jest
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {});
    try {
      const callObject = Daily.createCallObject();
      const Wrapper = createWrapper(callObject);
      const sessionId = faker.string.uuid();
      const track = new FakeMediaStreamTrack({ kind: 'audio' });
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        [sessionId]: {
          local: false,
          session_id: sessionId,
          tracks: {
            audio: {
              persistentTrack: track,
              state: 'playable',
              track: track,
            },
          },
        },
      }));
      const { container } = render(
        <Wrapper>
          <DailyAudioTrack sessionId={sessionId} />
        </Wrapper>
      );
      act(() => {
        emitParticipantJoined(callObject, {
          local: false,
          session_id: sessionId,
          // @ts-ignore
          tracks: {
            audio: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track: track,
            },
          },
        });
      });
      const audio = container.querySelector('audio') as HTMLAudioElement;
      await waitFor(() => {
        expect((audio.srcObject as MediaStream)?.getAudioTracks()).toHaveLength(
          1
        );
      });
      act(() => {
        emitLeftMeeting(callObject);
      });
      expect(pauseSpy).toHaveBeenCalled();
      expect(audio.srcObject).toBeNull();
    } finally {
      jest.restoreAllMocks();
    }
  });
  it('reports onPlayFailed when play() rejects', async () => {
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const playSpy = jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValue(
        Object.assign(new Error('A user gesture is required'), {
          name: 'NotAllowedError',
        })
      );
    try {
      const callObject = Daily.createCallObject();
      const Wrapper = createWrapper(callObject);
      const sessionId = faker.string.uuid();
      const track = new FakeMediaStreamTrack({ kind: 'audio' });
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        [sessionId]: {
          local: false,
          session_id: sessionId,
          tracks: {
            audio: {
              persistentTrack: track,
              state: 'playable',
              track: track,
            },
          },
        },
      }));
      const onPlayFailed = jest.fn();
      const { container } = render(
        <Wrapper>
          <DailyAudioTrack sessionId={sessionId} onPlayFailed={onPlayFailed} />
        </Wrapper>
      );
      act(() => {
        emitParticipantJoined(callObject, {
          local: false,
          session_id: sessionId,
          // @ts-ignore
          tracks: {
            audio: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track: track,
            },
          },
        });
      });
      const audio = container.querySelector('audio');
      await act(async () => {
        audio?.dispatchEvent(new Event('loadedmetadata'));
      });
      expect(playSpy).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(onPlayFailed).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionId,
            type: 'audio',
            name: 'NotAllowedError',
            message: 'A user gesture is required',
          })
        );
      });
    } finally {
      jest.restoreAllMocks();
    }
  });
});
