/// <reference types="@types/jest" />

import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { act, render, waitFor } from '@testing-library/react';
import { FakeMediaStreamTrack } from 'fake-mediastreamtrack';
import faker from 'faker';
import React from 'react';

import { DailyAudioTrack } from '../../src/components/DailyAudioTrack';
import { DailyProvider } from '../../src/DailyProvider';
import { emitParticipantJoined } from '../.test-utils/event-emitter';

jest.mock('../../src/DailyDevices', () => ({
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('DailyAudioTrack', () => {
  it('renders <audio> tag with expected attributes', () => {
    const Wrapper = createWrapper();
    const sessionId = faker.datatype.uuid();
    const { container } = render(
      <Wrapper>
        <DailyAudioTrack sessionId={sessionId} />
      </Wrapper>
    );
    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('autoplay');
    expect(audio).toHaveAttribute('playsinline');
    expect(audio).toHaveAttribute('data-audio-type', 'audio');
    expect(audio).toHaveAttribute('data-session-id', sessionId);
  });
  it('renders custom attributes to <audio> tag', () => {
    const Wrapper = createWrapper();
    const sessionId = faker.datatype.uuid();
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
    const callObject = DailyIframe.createCallObject();
    const Wrapper = createWrapper(callObject);
    const sessionId = faker.datatype.uuid();
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
});
