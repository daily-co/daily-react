import '@testing-library/jest-dom';
import { FakeMediaStreamTrack } from 'fake-mediastreamtrack';
import { faker } from '@faker-js/faker';

class MediaStream {
  active: boolean;
  id: string;
  tracks: MediaStreamTrack[] = [];

  constructor(tracks: MediaStreamTrack[] = [], id?: string) {
    this.tracks = tracks;
    this.id = id ?? faker.string.uuid();
    this.active = true;
  }

  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack) {
    this.tracks = this.tracks.filter(t => t.id !== track.id);
  }

  getAudioTracks() {
    return this.tracks.filter(t => t.kind === 'audio');
  }

  getVideoTracks() {
    return this.tracks.filter(t => t.kind === 'video');
  }

  getTracks() {
    return this.tracks;
  }

  stop() {
    this.active = false;
  }
}

Object.defineProperty(window, 'MediaStream', {
  value: MediaStream,
});

Object.defineProperty(window, 'MediaStreamTrack', {
  writable: true,
  value: FakeMediaStreamTrack,
})

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  value: () => {},
});

/**
 * Avoids "Cannot flush updates when React is already rendering." warnings in DailyVideo test output.
 * Source: https://github.com/testing-library/react-testing-library/issues/470#issuecomment-710775040
 */
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  set: () => {},
});

/**
 * Setting mocked values, otherwise videoWidth and videoHeight both return 0.
 */
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  value: 160,
});
Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  value: 90,
});
