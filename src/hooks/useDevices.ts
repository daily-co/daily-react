import {
  DailyEventObjectCameraError,
  DailyEventObjectFatalError,
  DailyEventObjectParticipant,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

type GeneralState =
  | 'pending'
  | 'not-supported'
  | 'granted'
  | 'blocked'
  | 'in-use'
  | 'not-found';

type DeviceState = 'granted' | 'in-use';
export interface StatefulDevice {
  device: MediaDeviceInfo;
  selected: boolean;
  state: DeviceState;
}

const generalCameraState = atom<GeneralState>({
  key: 'general-camera-state',
  default: 'pending',
});
const generalMicrophoneState = atom<GeneralState>({
  key: 'general-microphone-state',
  default: 'pending',
});
const cameraDevicesState = atom<StatefulDevice[]>({
  key: 'camera-devices',
  default: [],
});
const microphoneDevicesState = atom<StatefulDevice[]>({
  key: 'microphone-devices',
  default: [],
});
const speakerDevicesState = atom<StatefulDevice[]>({
  key: 'speaker-devices',
  default: [],
});

/**
 * This hook allows access to information about the user's devices and their state.
 */
export const useDevices = () => {
  const daily = useDaily();

  const camState = useRecoilValue(generalCameraState);
  const micState = useRecoilValue(generalMicrophoneState);
  const camDevices = useRecoilValue(cameraDevicesState);
  const micDevices = useRecoilValue(microphoneDevicesState);
  const speakerDevices = useRecoilValue(speakerDevicesState);

  /**
   * Refreshes list of available devices using enumerateDevices.
   * Previous device states are kept in place, otherwise states are initialized as 'granted'.
   */
  const refreshDevices = useRecoilCallback(
    ({ transact_UNSTABLE }) =>
      async () => {
        /**
         * Check for legacy browsers.
         */
        if (
          typeof navigator?.mediaDevices?.getUserMedia === 'undefined' ||
          typeof navigator?.mediaDevices?.enumerateDevices === 'undefined'
        ) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'not-supported');
            set(generalMicrophoneState, 'not-supported');
          });
          return;
        }

        if (!daily) return;

        try {
          const { devices } = await daily.enumerateDevices();
          /**
           * Filter out "empty" devices for when device access has not been granted (yet).
           */
          const cams = devices.filter(
            (d) => d.kind === 'videoinput' && d.deviceId !== ''
          );
          const mics = devices.filter(
            (d) => d.kind === 'audioinput' && d.deviceId !== ''
          );
          const speakers = devices.filter(
            (d) => d.kind === 'audiooutput' && d.deviceId !== ''
          );
          const { camera, mic, speaker } = await daily.getInputDevices();

          const mapDevice = (
            device: {} | MediaDeviceInfo,
            d: MediaDeviceInfo,
            prevDevices: StatefulDevice[]
          ) => ({
            device: d,
            selected: 'deviceId' in device && d.deviceId === device.deviceId,
            state:
              prevDevices.find((p) => p.device.deviceId === d.deviceId)
                ?.state ?? 'granted',
          });
          const sortDeviceByLabel = (a: StatefulDevice, b: StatefulDevice) => {
            if (a.device.deviceId === 'default') return -1;
            if (b.device.deviceId === 'default') return 1;
            if (a.device.label < b.device.label) return -1;
            if (a.device.label > b.device.label) return 1;
            return 0;
          };

          transact_UNSTABLE(({ set }) => {
            set(cameraDevicesState, (prevCams) =>
              cams
                .filter(Boolean)
                .map<StatefulDevice>((d) => mapDevice(camera, d, prevCams))
                .sort(sortDeviceByLabel)
            );
            set(microphoneDevicesState, (prevMics) =>
              mics
                .filter(Boolean)
                .map<StatefulDevice>((d) => mapDevice(mic, d, prevMics))
                .sort(sortDeviceByLabel)
            );
            set(speakerDevicesState, (prevSpeakers) =>
              speakers
                .filter(Boolean)
                .map<StatefulDevice>((d) => mapDevice(speaker, d, prevSpeakers))
                .sort(sortDeviceByLabel)
            );
          });
        } catch (e) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'not-supported');
            set(generalMicrophoneState, 'not-supported');
          });
        }
      },
    [daily]
  );

  /**
   * Updates general and specific device states, based on blocked status.
   */
  const updateDeviceStates = useRecoilCallback(
    ({ set, snapshot, transact_UNSTABLE }) =>
      async () => {
        if (!daily) return;

        const currentCamState = await snapshot.getPromise(generalCameraState);
        const currentMicState = await snapshot.getPromise(
          generalMicrophoneState
        );

        const { tracks } = daily.participants().local;

        const awaitingCamAccess =
          currentCamState === 'pending' && tracks.video.state === 'interrupted';
        const awaitingMicAccess =
          currentMicState === 'pending' && tracks.audio.state === 'interrupted';

        if (tracks.audio?.blocked?.byDeviceInUse) {
          transact_UNSTABLE(({ set }) => {
            set(generalMicrophoneState, 'in-use');
            set(microphoneDevicesState, (mics) =>
              mics.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'in-use' } : m
              )
            );
          });
        } else if (tracks.audio?.blocked?.byDeviceMissing) {
          set(generalMicrophoneState, 'not-found');
        } else if (tracks.audio?.blocked?.byPermissions) {
          set(generalMicrophoneState, 'blocked');
        } else if (!awaitingMicAccess) {
          transact_UNSTABLE(({ set }) => {
            set(generalMicrophoneState, 'granted');
            set(microphoneDevicesState, (mics) =>
              mics.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'granted' } : m
              )
            );
          });
        }

        if (tracks.video?.blocked?.byDeviceInUse) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'in-use');
            set(cameraDevicesState, (cams) =>
              cams.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'in-use' } : m
              )
            );
          });
        } else if (tracks.video?.blocked?.byDeviceMissing) {
          set(generalCameraState, 'not-found');
        } else if (tracks.video?.blocked?.byPermissions) {
          set(generalCameraState, 'blocked');
        } else if (!awaitingCamAccess) {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'granted');
            set(cameraDevicesState, (cams) =>
              cams.map<StatefulDevice>((m) =>
                m.selected ? { ...m, state: 'granted' } : m
              )
            );
          });
        }
        refreshDevices();
      },
    [daily, refreshDevices]
  );

  useDailyEvent(
    'participant-updated',
    useCallback(
      (ev: DailyEventObjectParticipant) => {
        if (!ev.participant.local) return;
        updateDeviceStates();
      },
      [updateDeviceStates]
    )
  );

  useDailyEvent(
    'camera-error',
    useRecoilCallback(
      ({ set, transact_UNSTABLE }) =>
        ({
          errorMsg: { errorMsg, audioOk, videoOk },
          error,
        }: DailyEventObjectCameraError) => {
          switch (error?.type) {
            case 'cam-in-use':
              set(generalCameraState, 'in-use');
              break;
            case 'mic-in-use':
              set(generalMicrophoneState, 'in-use');
              break;
            case 'cam-mic-in-use':
              transact_UNSTABLE(({ set }) => {
                set(generalCameraState, 'in-use');
                set(generalMicrophoneState, 'in-use');
              });
              break;
            default:
              switch (errorMsg) {
                case 'devices error':
                  transact_UNSTABLE(({ set }) => {
                    if (!videoOk) set(generalCameraState, 'not-found');
                    if (!audioOk) set(generalMicrophoneState, 'not-found');
                  });
                  break;
                case 'not allowed': {
                  transact_UNSTABLE(({ set }) => {
                    set(generalCameraState, 'blocked');
                    set(generalMicrophoneState, 'blocked');
                  });
                  updateDeviceStates();
                  break;
                }
              }
              break;
          }
        },
      [updateDeviceStates]
    )
  );

  useDailyEvent(
    'error',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        ({ errorMsg }: DailyEventObjectFatalError) => {
          switch (errorMsg) {
            case 'not allowed': {
              transact_UNSTABLE(({ set }) => {
                set(generalCameraState, 'blocked');
                set(generalMicrophoneState, 'blocked');
              });
              updateDeviceStates();
              break;
            }
          }
        },
      [updateDeviceStates]
    )
  );

  /**
   * Update all device state, when camera is started.
   */
  useDailyEvent(
    'started-camera',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        () => {
          transact_UNSTABLE(({ set }) => {
            set(generalCameraState, 'granted');
            set(generalMicrophoneState, 'granted');
          });
          updateDeviceStates();
        },
      [updateDeviceStates]
    )
  );

  /**
   * Sets video input device to given deviceId.
   */
  const setCamera = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        videoDeviceId: deviceId,
      });
      refreshDevices();
    },
    [daily, refreshDevices]
  );

  /**
   * Sets audio input device to given deviceId.
   */
  const setMicrophone = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        audioDeviceId: deviceId,
      });
      refreshDevices();
    },
    [daily, refreshDevices]
  );

  /**
   * Sets audio output device to given deviceId.
   */
  const setSpeaker = useCallback(
    async (deviceId: string) => {
      daily?.setOutputDevice({
        outputDeviceId: deviceId,
      });
      refreshDevices();
    },
    [daily, refreshDevices]
  );

  return {
    /**
     * A list of the user's camera (videoinput) devices. See [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo) for more info.
     */
    cameras: camDevices,
    /**
     * The general state for camera access.
     */
    camState,
    /**
     * Indicates that there's an issue with camera devices.
     */
    hasCamError: ['blocked', 'in-use', 'not-found'].includes(camState),
    /**
     * Indicates that there's an issue with microphone devices.
     */
    hasMicError: ['blocked', 'in-use', 'not-found'].includes(micState),
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
};
