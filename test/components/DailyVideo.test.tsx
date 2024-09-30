/// <reference types="@types/jest" />
/// <reference types="@testing-library/jest-dom" />

import Daily, { DailyCall } from '@daily-co/daily-js';
import { faker } from '@faker-js/faker';
import { act, render, waitFor } from '@testing-library/react';
import { FakeMediaStreamTrack } from 'fake-mediastreamtrack';
import React from 'react';

import { DailyVideo } from '../../src/components/DailyVideo';
import { DailyProvider } from '../../src/DailyProvider';
import {
  emitParticipantJoined,
  emitParticipantUpdated,
} from '../.test-utils/event-emitter';

const localSessionId = faker.string.uuid();

jest.mock('../../src/hooks/useLocalSessionId', () => ({
  useLocalSessionId: () => localSessionId,
}));
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

describe('DailyVideo', () => {
  it('renders <video> tag with expected attributes', () => {
    const Wrapper = createWrapper();
    const sessionId = faker.string.uuid();
    const { container } = render(
      <Wrapper>
        <DailyVideo sessionId={sessionId} type="video" />
      </Wrapper>
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('data-video-type', 'video');
    expect(video).toHaveAttribute('data-session-id', sessionId);
  });
  it('renders custom attributes to <video> tag', () => {
    const Wrapper = createWrapper();
    const sessionId = faker.string.uuid();
    const attributes = {
      id: 'customId',
      'data-custom': 'value',
    };
    const { container } = render(
      <Wrapper>
        <DailyVideo sessionId={sessionId} type="video" {...attributes} />
      </Wrapper>
    );
    const video = container.querySelector('video');
    for (let [key, val] of Object.entries(attributes)) {
      expect(video).toHaveAttribute(key, val);
    }
  });
  it('assigns correct video track to <video> tag', async () => {
    const callObject = Daily.createCallObject();
    const Wrapper = createWrapper(callObject);
    const sessionId = faker.string.uuid();
    const track = new FakeMediaStreamTrack({ kind: 'video' });
    (callObject.participants as jest.Mock).mockImplementation(() => ({
      [sessionId]: {
        local: false,
        session_id: sessionId,
        tracks: {
          video: {
            persistentTrack: track,
            state: 'playable',
            track: track,
          },
        },
      },
    }));
    const { container } = render(
      <Wrapper>
        <DailyVideo sessionId={sessionId} type="video" />
      </Wrapper>
    );
    act(() => {
      emitParticipantJoined(callObject, {
        local: false,
        session_id: sessionId,
        // @ts-ignore
        tracks: {
          video: {
            persistentTrack: track,
            state: 'playable',
            subscribed: true,
            track: track,
          },
        },
      });
    });
    await waitFor(() => {
      const video = container.querySelector('video');
      expect(
        (video?.srcObject as MediaStream)?.getVideoTracks()?.[0]?.id
      ).toEqual(track.id);
      expect(video).toHaveAttribute('data-subscribed', 'true');
    });
  });
  it('renders staged subscription in data-subscribed attribute', async () => {
    const callObject = Daily.createCallObject();
    const Wrapper = createWrapper(callObject);
    const sessionId = faker.string.uuid();
    const track = new FakeMediaStreamTrack({ kind: 'video' });
    (callObject.participants as jest.Mock).mockImplementation(() => ({
      [sessionId]: {
        local: false,
        session_id: sessionId,
        tracks: {
          video: {
            persistentTrack: track,
            state: 'playable',
            subscribed: 'staged',
            track: track,
          },
        },
      },
    }));
    const { container } = render(
      <Wrapper>
        <DailyVideo sessionId={sessionId} type="video" />
      </Wrapper>
    );
    act(() => {
      emitParticipantJoined(callObject, {
        local: false,
        session_id: sessionId,
        // @ts-ignore
        tracks: {
          video: {
            persistentTrack: track,
            state: 'playable',
            subscribed: 'staged',
            track: track,
          },
        },
      });
    });
    await waitFor(() => {
      expect(container.querySelector('video')).toHaveAttribute(
        'data-subscribed',
        'staged'
      );
    });
  });
  it('calls onResize callback with video dimensions', async () => {
    const callObject = Daily.createCallObject();
    const Wrapper = createWrapper(callObject);
    const sessionId = faker.string.uuid();
    const track = new FakeMediaStreamTrack({ kind: 'video' });
    (callObject.participants as jest.Mock).mockImplementation(() => ({
      [sessionId]: {
        local: false,
        session_id: sessionId,
        tracks: {
          video: {
            persistentTrack: track,
            state: 'playable',
            subscribed: true,
            track: track,
          },
        },
      },
    }));
    const handleResize = jest.fn();
    render(
      <Wrapper>
        <DailyVideo
          onResize={handleResize}
          sessionId={sessionId}
          style={{
            width: 160,
            height: 90,
          }}
          type="video"
        />
      </Wrapper>
    );
    act(() => {
      emitParticipantJoined(callObject, {
        local: false,
        session_id: sessionId,
        // @ts-ignore
        tracks: {
          video: {
            persistentTrack: track,
            state: 'playable',
            subscribed: true,
            track: track,
          },
        },
      });
    });
    await waitFor(() => {
      // Width and height mocked in jest-setup.ts
      expect(handleResize).toHaveBeenCalledWith({
        aspectRatio: 160 / 90,
        height: 90,
        width: 160,
      });
    });
  });
  it('flips video via CSS when mirrored', () => {
    const callObject = Daily.createCallObject();
    const Wrapper = createWrapper(callObject);
    const sessionId = faker.string.uuid();
    const { container } = render(
      <Wrapper>
        <DailyVideo mirror sessionId={sessionId} type="video" />
      </Wrapper>
    );
    expect(container.querySelector('video')).toHaveStyle({
      transform: 'scale(-1, 1)',
    });
  });
  describe('with automirror enabled', () => {
    it('flips local video via CSS (no video track)', () => {
      const callObject = Daily.createCallObject();
      const Wrapper = createWrapper(callObject);
      const { container } = render(
        <Wrapper>
          <DailyVideo automirror sessionId={localSessionId} type="video" />
        </Wrapper>
      );
      expect(container.querySelector('video')).toHaveStyle({
        transform: 'scale(-1, 1)',
      });
    });
    it('flips local video via CSS (video track without facingMode)', async () => {
      const callObject = Daily.createCallObject();
      const Wrapper = createWrapper(callObject);
      const track = new FakeMediaStreamTrack({
        kind: 'video',
      });
      track.getSettings = () => ({});
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
          tracks: {
            video: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track,
            },
          },
        },
      }));
      const { container } = render(
        <Wrapper>
          <DailyVideo automirror sessionId={localSessionId} type="video" />
        </Wrapper>
      );
      act(() => {
        emitParticipantUpdated(callObject, {
          local: true,
          session_id: localSessionId,
          // @ts-ignore
          tracks: {
            video: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track,
            },
          },
        });
      });
      await waitFor(() => {
        const video = container.querySelector('video');
        expect(video).toHaveAttribute('data-subscribed', 'true');
        expect(video).toHaveStyle({
          transform: 'scale(-1, 1)',
        });
      });
    });
    it('flips local video via CSS (user facing video track)', async () => {
      const callObject = Daily.createCallObject();
      const Wrapper = createWrapper(callObject);
      const track = new FakeMediaStreamTrack({
        kind: 'video',
      });
      track.getSettings = () => ({
        facingMode: 'user',
      });
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
          tracks: {
            video: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track,
            },
          },
        },
      }));
      const { container } = render(
        <Wrapper>
          <DailyVideo automirror sessionId={localSessionId} type="video" />
        </Wrapper>
      );
      act(() => {
        emitParticipantUpdated(callObject, {
          local: true,
          session_id: localSessionId,
          // @ts-ignore
          tracks: {
            video: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track,
            },
          },
        });
      });
      await waitFor(() => {
        const video = container.querySelector('video');
        expect(video).toHaveAttribute('data-subscribed', 'true');
        expect(video).toHaveStyle({
          transform: 'scale(-1, 1)',
        });
      });
    });
    it('does not flip local video via CSS (environment facing video track)', async () => {
      const callObject = Daily.createCallObject();
      const Wrapper = createWrapper(callObject);
      const track = new FakeMediaStreamTrack({
        kind: 'video',
      });
      track.getSettings = () => ({
        facingMode: 'environment',
      });
      (callObject.participants as jest.Mock).mockImplementation(() => ({
        local: {
          local: true,
          session_id: localSessionId,
          tracks: {
            video: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track,
            },
          },
        },
      }));
      const { container } = render(
        <Wrapper>
          <DailyVideo automirror sessionId={localSessionId} type="video" />
        </Wrapper>
      );
      act(() => {
        emitParticipantUpdated(callObject, {
          local: true,
          session_id: localSessionId,
          // @ts-ignore
          tracks: {
            video: {
              persistentTrack: track,
              state: 'playable',
              subscribed: true,
              track,
            },
          },
        });
      });
      await waitFor(() => {
        const video = container.querySelector('video');
        expect(video).toHaveAttribute('data-subscribed', 'true');
        expect(video).not.toHaveStyle({
          transform: 'scale(-1, 1)',
        });
      });
    });
  });
});
