/// <reference types="@types/jest" />

import { FakeMediaStreamTrack } from 'fake-mediastreamtrack';

import { customDeepEqual } from '../../src/lib/customDeepEqual';

describe('customDeepEqual', () => {
  describe('Primitives and simple types', () => {
    it.each`
      a            | b            | expected
      ${1}         | ${1}         | ${true}
      ${'string'}  | ${'string'}  | ${true}
      ${'a'}       | ${'b'}       | ${false}
      ${null}      | ${null}      | ${true}
      ${undefined} | ${undefined} | ${true}
      ${42}        | ${'42'}      | ${false}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('Arrays', () => {
    it.each`
      a              | b              | expected
      ${[1, 2, 3]}   | ${[1, 2, 3]}   | ${true}
      ${[1, 2, 3]}   | ${[3, 2, 1]}   | ${false}
      ${[1, [2, 3]]} | ${[1, [2, 3]]} | ${true}
      ${[1, [2, 3]]} | ${[1, 2, 3]}   | ${false}
      ${[]}          | ${[]}          | ${true}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('Objects', () => {
    it.each`
      a                                                        | b                                                        | expected
      ${{ key: 'value' }}                                      | ${{ key: 'value' }}                                      | ${true}
      ${{ key: 'value' }}                                      | ${{ key: 'different' }}                                  | ${false}
      ${{ key1: 'value', key2: { nestedKey: 'nestedValue' } }} | ${{ key1: 'value', key2: { nestedKey: 'nestedValue' } }} | ${true}
      ${{ key1: 'value' }}                                     | ${{ key2: 'value' }}                                     | ${false}
      ${{}}                                                    | ${{}}                                                    | ${true}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('MediaStream', () => {
    const streamA = new MediaStream();
    afterEach(() => {
      streamA.getTracks().forEach((track) => {
        streamA.removeTrack(track);
        track.stop();
      });
    });
    it('returns true when streams are equal', () => {
      expect(customDeepEqual(streamA, streamA)).toBe(true);
    });
    it('returns true when equal stream has the same tracks', () => {
      const track = new FakeMediaStreamTrack({ kind: 'audio' });
      streamA.addTrack(track);
      expect(customDeepEqual(streamA, streamA)).toBe(true);
    });
    it('returns false when streams are not equal', () => {
      const streamB = new MediaStream();
      expect(customDeepEqual(streamA, streamB)).toBe(false);
    });
    it('returns false when amount of tracks differs', () => {
      const track = new FakeMediaStreamTrack({ kind: 'audio' });
      // @ts-ignore
      const streamC = new MediaStream([], streamA.id);
      streamA.addTrack(track);
      expect(customDeepEqual(streamA, streamC)).toBe(false);
    });
    it('returns false when track id differs', () => {
      const track1 = new FakeMediaStreamTrack({ kind: 'audio' });
      const track2 = new FakeMediaStreamTrack({ kind: 'audio' });
      // Uses mock from jest-setup.ts, but TypeScript still thinks this is a valid MediaStream
      // @ts-ignore
      const streamC = new MediaStream([], streamA.id);
      streamA.addTrack(track1);
      streamC.addTrack(track2);
      expect(customDeepEqual(streamA, streamC)).toBe(false);
    });
  });

  describe('MediaStreamTracks', () => {
    it.each`
      a                                                                           | b                                                                            | expected
      ${new FakeMediaStreamTrack({ id: '1', kind: 'audio', readyState: 'live' })} | ${new FakeMediaStreamTrack({ id: '1', kind: 'audio', readyState: 'live' })}  | ${true}
      ${new FakeMediaStreamTrack({ id: '1', kind: 'audio', readyState: 'live' })} | ${new FakeMediaStreamTrack({ id: '2', kind: 'audio', readyState: 'live' })}  | ${false}
      ${new FakeMediaStreamTrack({ id: '1', kind: 'audio', readyState: 'live' })} | ${new FakeMediaStreamTrack({ id: '1', kind: 'video', readyState: 'live' })}  | ${false}
      ${new FakeMediaStreamTrack({ id: '1', kind: 'audio', readyState: 'live' })} | ${new FakeMediaStreamTrack({ id: '1', kind: 'audio', readyState: 'ended' })} | ${false}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('Date objects', () => {
    it.each`
      a                         | b                         | expected
      ${new Date('2023-01-01')} | ${new Date('2023-01-01')} | ${true}
      ${new Date('2023-01-01')} | ${new Date('2022-01-01')} | ${false}
      ${new Date('2023-01-01')} | ${'2023-01-01'}           | ${false}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('RegExp objects', () => {
    it.each`
      a           | b            | expected
      ${/test/gi} | ${/test/gi}  | ${true}
      ${/test/g}  | ${/test/gi}  | ${false}
      ${/test/g}  | ${'/test/g'} | ${false}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('Set', () => {
    it.each`
      a                                                            | b                                                            | expected
      ${new Set()}                                                 | ${new Set()}                                                 | ${true}
      ${new Set(['a'])}                                            | ${new Set(['b'])}                                            | ${false}
      ${new Set(['a'])}                                            | ${new Set(['a', 'b'])}                                       | ${false}
      ${new Set(['a'])}                                            | ${['a']}                                                     | ${false}
      ${new Set(['audio', 'video', 'screenVideo', 'screenAudio'])} | ${new Set(['audio', 'video', 'screenVideo', 'screenAudio'])} | ${true}
      ${new Set([])}                                               | ${new Set(['audio'])}                                        | ${false}
      ${new Set([])}                                               | ${new Set([])}                                               | ${true}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('Map', () => {
    it.each`
      a                      | b                                | expected
      ${new Map()}           | ${new Map()}                     | ${true}
      ${new Map([['a', 1]])} | ${new Map([['b', 1]])}           | ${false}
      ${new Map([['a', 1]])} | ${new Map([['a', 1], ['b', 1]])} | ${false}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('Functions', () => {
    const funcA = () => 'test';
    const funcB = () => 'test';
    it.each`
      a        | b        | expected
      ${funcA} | ${funcA} | ${true}
      ${funcA} | ${funcB} | ${false}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });

  describe('Complex nested objects', () => {
    const complexObjA = {
      string: 'value',
      number: 42,
      bool: false,
      date: new Date('2023-01-01'),
      regex: /test/g,
      array: [1, { key: 'nested' }, [2, 3]],
      func: () => 'test',
    };

    const complexObjB = {
      ...complexObjA,
      array: [1, { key: 'nested' }, [2, 3]], // Identical but different reference
    };

    const complexObjC = {
      ...complexObjA,
      string: 'different',
    };

    it.each`
      a              | b              | expected
      ${complexObjA} | ${complexObjB} | ${true}
      ${complexObjA} | ${complexObjC} | ${false}
    `('returns $expected for a: $a and b: $b', ({ a, b, expected }) => {
      expect(customDeepEqual(a, b)).toBe(expected);
    });
  });
});
