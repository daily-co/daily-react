/// <reference types="@types/jest" />

import { resolveParticipantPath } from '../../src/utils/resolveParticipantPath';

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
    const result = resolveParticipantPath(
      // @ts-ignore
      participant,
      'user_name'
    );
    expect(result).toEqual(participant.user_name);
  });
  it('Accessing an object', () => {
    const result = resolveParticipantPath(
      // @ts-ignore
      participant,
      'tracks.audio'
    );
    expect(result).toEqual(participant.tracks.audio);
  });
  it('Accessing a non-existent property', () => {
    const result = resolveParticipantPath(
      // @ts-ignore
      participant,
      'tracks.audio.persistentTrack'
    );
    expect(result).toEqual(undefined);
  });
  it('Accessing a nested value', () => {
    const result = resolveParticipantPath(
      // @ts-ignore
      participant,
      'tracks.audio.subscribed'
    );
    expect(result).toEqual(participant.tracks.audio.subscribed);
  });
});
