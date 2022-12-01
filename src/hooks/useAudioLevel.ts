import { useEffect, useRef } from 'react';

/**
 * Returns the audio volume level of a given MediaStream.
 * @param stream The media stream to be analysed.
 * @param onVolumeChange The function to execute when the volume changes. Can be used to visualise audio output.
 */
export const useAudioLevel = (
  stream: MediaStream,
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
      if (!stream) {
        onVolumeChange(0);
        return;
      }
      const audioContext = audioCtx.current;
      if (!audioContext) return;

      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
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
            await audioContext.audioWorklet.addModule(
              `data:application/javascript;charset=utf8,${encodeURIComponent(`
              class AudioLevelProcessor extends AudioWorkletProcessor {
                volume;
                interval;
                nextFrame;
              
                constructor() {
                  super();
                  this.volume = 0;
                  this.interval = 25;
                  this.nextFrame = this.interval;
                }
              
                get intervalInFrames() {
                  // sampleRate is globally defined in AudioWorklets.
                  // See https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletGlobalScope
                  // eslint-disable-next-line no-undef
                  return (this.interval / 1000) * sampleRate;
                }
              
                process(inputList) {
                  const firstInput = inputList[0];
              
                  if (firstInput.length > 0) {
                    const inputData = firstInput[0];
                    let total = 0;
              
                    for (let i = 0; i < inputData.length; ++i) {
                      total += Math.abs(inputData[i]);
                    }
              
                    const rms = Math.sqrt(total / inputData.length);
                    this.volume = Math.max(0, Math.min(1, rms));
              
                    this.nextFrame -= inputData.length;
                    if (this.nextFrame < 0) {
                      this.nextFrame += this.intervalInFrames;
                      this.port.postMessage({ volume: this.volume });
                    }
                  }
              
                  return true;
                }
              }
              
              registerProcessor('audiolevel', AudioLevelProcessor);              
              `)}`
            );
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
    [onVolumeChange, stream]
  );
};
