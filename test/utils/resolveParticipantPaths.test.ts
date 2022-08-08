/// <reference types="@types/jest" />

import { resolveParticipantPaths } from '../../src/utils/resolveParticipantPaths';

describe('Resolve the participant path', () => {
  const participant = {
    session_id: 'a',
    user_name: 'Alpha',
    tracks: {
      audio: {
        subscribed: true,
        state: 'playable',
      },
      video: {
        subscribed: true,
        state: 'playable',
      },
      screenAudio: {
        subscribed: true,
        state: 'playable',
      },
      screenVideo: {
        subscribed: true,
        state: 'playable',
      },
    },
  };
  it('Accessing a top level property', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['user_name']
    );
    expect(result).toEqual({ user_name: participant.user_name });
  });
  it('Accessing an object', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio']
    );
    expect(result).toEqual({ 'tracks.audio': participant.tracks.audio });
  });
  it('Accessing a non-existent property', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio.persistentTrack']
    );
    expect(result).toEqual({ 'tracks.audio.persistentTrack': undefined });
  });
  it('Accessing a nested value', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio.subscribed']
    );
    expect(result).toEqual({
      'tracks.audio.subscribed': participant.tracks.audio.subscribed,
    });
  });
  it('Accessing multiple values', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio.subscribed', 'user_name']
    );
    expect(result).toEqual({
      'tracks.audio.subscribed': participant.tracks.audio.subscribed,
      user_name: participant.user_name,
    });
  });
});
