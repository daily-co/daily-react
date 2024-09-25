import { useAtomValue } from 'jotai';
import { useCallback, useContext, useDebugValue } from 'react';

import {
  cameraDevicesState,
  generalCameraState,
  generalMicrophoneState,
  lastCameraErrorState,
  microphoneDevicesState,
  speakerDevicesState,
} from '../DailyDevices';
import { DailyDevicesContext } from '../DailyDevicesContext';
import { useDaily } from './useDaily';

/**
 * This hook allows access to information about the user's devices and their state.
 */
export const useDevices = () => {
  const daily = useDaily();

  const camState = useAtomValue(generalCameraState);
  const micState = useAtomValue(generalMicrophoneState);
  const camDevices = useAtomValue(cameraDevicesState);
  const micDevices = useAtomValue(microphoneDevicesState);
  const speakerDevices = useAtomValue(speakerDevicesState);
  const cameraError = useAtomValue(lastCameraErrorState);

  const { refreshDevices } = useContext(DailyDevicesContext);

  /**
   * Sets video input device to given deviceId.
   */
  const setCamera = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        audioDeviceId: null,
        videoDeviceId: deviceId,
      });
    },
    [daily]
  );

  /**
   * Sets audio input device to given deviceId.
   */
  const setMicrophone = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        audioDeviceId: deviceId,
        videoDeviceId: null,
      });
    },
    [daily]
  );

  /**
   * Sets audio output device to given deviceId.
   */
  const setSpeaker = useCallback(
    async (deviceId: string) => {
      await daily?.setOutputDeviceAsync({
        outputDeviceId: deviceId,
      });
    },
    [daily]
  );

  const errorStates: typeof camState[] = [
    'blocked',
    'in-use',
    'not-found',
    'constraints-invalid',
    'constraints-none-specified',
    'undefined-mediadevices',
    'unknown',
  ];

  const result = {
    /**
     * Most recent error object emitted via [camera-error event](https://docs.daily.co/reference/daily-js/events/meeting-events#camera-error).
     */
    cameraError,
    /**
     * A list of the user's camera (videoinput) devices. See [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo) for more info.
     */
    cameras: camDevices,
    /**
     * The general state for camera access.
     */
    camState,
    /**
     * Holds the currently selected camera.
     */
    currentCam: camDevices.find((cam) => cam.selected),
    /**
     * Holds the currently selected microphone.
     */
    currentMic: micDevices.find((mic) => mic.selected),
    /**
     * Holds the currently selected speaker.
     */
    currentSpeaker: speakerDevices.find((speaker) => speaker.selected),
    /**
     * Indicates that there's an issue with camera devices.
     */
    hasCamError: errorStates.includes(camState),
    /**
     * Indicates that there's an issue with microphone devices.
     */
    hasMicError: errorStates.includes(micState),
    /**
     * A list of the user's microphone (audioinput) devices. See [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo) for more info.
     */
    microphones: micDevices,
    /**
     * The general state for microphone access.
     */
    micState,
    /**
     * Refreshes the list of devices using [enumerateDevices](https://docs.daily.co/reference/daily-js/instance-methods/enumerate-devices).
     */
    refreshDevices,
    /**
     * Allows to switch to the camera with the specified deviceId. Calls [setInputDevicesAsync](https://docs.daily.co/reference/daily-js/instance-methods/set-input-devices-async) internally.
     */
    setCamera,
    /**
     * Allows to switch to the microphone with the specified deviceId. Calls [setInputDevicesAsync](https://docs.daily.co/reference/daily-js/instance-methods/set-input-devices-async) internally.
     */
    setMicrophone,
    /**
     * Allows to switch to the speaker with the specified deviceId. Calls [setOutputDevice](https://docs.daily.co/reference/daily-js/instance-methods/set-output-device) internally.
     */
    setSpeaker,
    /**
     * A list of the user's speaker (audiooutput) devices. See [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo) for more info.
     */
    speakers: speakerDevices,
  };

  useDebugValue(result);

  return result;
};
