import { useEffect, useRef } from 'react';

import { inlineAudioWorklet } from '../lib/inlineAudioWorklet';
/**
 * Returns the volume level of a given MediaStreamTrack.
 * @param mediaTrack The MediaStreamTrack to be analysed.
 * @param onVolumeChange The function to execute when the volume changes. Can be used to visualise audio output.
 */
export const useAudioLevel = (
  mediaTrack: MediaStreamTrack,
  onVolumeChange: (volume: number) => void
) => {
  const audioCtx = useRef<AudioContext>();

  useEffect(function setupAudioContext() {
    const AudioCtx =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof window.webkitAudioContext !== 'undefined'
        ? window.webkitAudioContext
        : null;
    if (!AudioCtx) return;
    audioCtx.current = new AudioCtx();
    return () => {
      audioCtx.current?.close();
    };
  }, []);

  useEffect(
    function setupStreamAndStartProcessing() {
      if (!mediaTrack) {
        onVolumeChange(0);
        return;
      }
      const audioContext = audioCtx.current;
      if (!audioContext) return;

      const mediaStreamSource = audioContext.createMediaStreamSource(
        new MediaStream([mediaTrack])
      );
      let node: AudioWorkletNode | null;

      const startProcessing = async () => {
        /**
         * Try to add the module only once.
         * In case it's not added to the audio context, yet, trying to initialize it will fail.
         * There's only one real reason for `new AudioWorkletNode` to fail and that is
         * when the corresponding module isn't added to the audio context, yet.
         * This makes sure we only add the module once.
         *
         * We're inlining the worklet instead of loading it via a URL as not to complicate bundling
         * this package.
         */
        try {
          node = new AudioWorkletNode(audioContext, 'audiolevel');
        } catch {
          try {
            await audioContext.audioWorklet.addModule(inlineAudioWorklet);
            node = new AudioWorkletNode(audioContext, 'audiolevel');
          } catch (e) {
            console.error(e);
          }
        }

        if (!node) return;

        node.port.onmessage = (event) => {
          let volume = 0;
          if (event.data.volume) volume = event.data.volume;
          if (!node) return;
          onVolumeChange(volume);
        };

        try {
          mediaStreamSource.connect(node).connect(audioContext.destination);
        } catch (e) {
          console.warn(e);
        }
      };

      startProcessing();

      return () => {
        node?.disconnect();
        node = null;
        mediaStreamSource?.disconnect();
      };
    },
    [onVolumeChange, mediaTrack]
  );
};
