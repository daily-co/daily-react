import React, { forwardRef, useEffect, useMemo, useRef } from 'react';

import { useLocalSessionId } from '../hooks/useLocalSessionId';
import { useMediaTrack } from '../hooks/useMediaTrack';
import useMergedRef from '../hooks/useMergedRef';
import { useParticipantProperty } from '../hooks/useParticipantProperty';

interface DailyVideoDimensions {
  aspectRatio: number;
  height: number;
  width: number;
}

interface Props extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /**
   * For local user-facing camera streams, we'll automatically mirror the video.
   */
  automirror?: boolean;
  /**
   * Defines whether the video should be fully contained or cover the box. Default: 'contain'.
   */
  fit?: 'contain' | 'cover';
  /**
   * Forces the video to be mirrored, if set.
   */
  mirror?: boolean;
  /**
   * Optional styles to apply, when video is playable.
   */
  playableStyle?: React.CSSProperties;
  /**
   * Optional callback, which is triggered whenever the video's rendered width or height changes.
   * Returns the video's native width, height and aspectRatio.
   */
  onResize?(dimensions: DailyVideoDimensions): void;
  /**
   * Identifies the participant for which a video stream should be rendered.
   */
  sessionId: string;
  /**
   * Defines the track type being used.
   */
  type: 'video' | 'screenVideo';
}

export const DailyVideo = forwardRef<HTMLVideoElement, Props>(
  (
    {
      automirror,
      fit = 'contain',
      mirror,
      onResize,
      playableStyle = {},
      sessionId,
      style = {},
      type = 'video',
      ...props
    },
    ref
  ) => {
    const localSessionId = useLocalSessionId();
    const isLocal = localSessionId === sessionId;
    const isScreen = type === 'screenVideo';
    const isLocalCam = isLocal && !isScreen;

    const videoEl = useRef<HTMLVideoElement>(null);
    const videoRef = useMergedRef<HTMLVideoElement>(videoEl, ref);

    const videoState = useMediaTrack(sessionId, type);
    const videoTrack = videoState.persistentTrack;
    /**
     * Considered as playable video:
     * - local cam feed
     * - any screen share
     * - remote cam feed that is subscribed and reported as playable
     */
    const isPlayable = isLocalCam || isScreen || !videoState.isOff;
    const subscribedState = useParticipantProperty(
      sessionId,
      `tracks.${type}.subscribed`
    );

    /**
     * Determine if video needs to be mirrored.
     */
    const isMirrored = useMemo(() => {
      if (typeof mirror === 'boolean') return mirror;
      if (!automirror) return false;
      if (!videoTrack) return isLocalCam;

      const videoTrackSettings = videoTrack.getSettings();
      const isUsersFrontCamera =
        'facingMode' in videoTrackSettings
          ? isLocalCam && videoTrackSettings.facingMode === 'user'
          : isLocalCam;
      // only apply mirror effect to user facing camera
      return isUsersFrontCamera;
    }, [automirror, isLocalCam, mirror, videoTrack]);

    /**
     * Handle canplay & picture-in-picture events.
     */
    useEffect(function setupVideoEvents() {
      const video = videoEl.current;
      if (!video) return;
      const handleCanPlay = () => {
        if (!video.paused) return;
        video.play();
      };
      const handleEnterPIP = () => {
        video.style.transform = 'scale(1)';
      };
      const handleLeavePIP = () => {
        video.style.transform = '';
        setTimeout(() => {
          if (video.paused) video.play();
        }, 100);
      };
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') return;
        if (!video.paused) return;
        video.play();
      };
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('enterpictureinpicture', handleEnterPIP);
      video.addEventListener('leavepictureinpicture', handleLeavePIP);

      // Videos can be paused if media was played in another app on iOS.
      // Resuming here, when returning back to Daily call.
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('enterpictureinpicture', handleEnterPIP);
        video.removeEventListener('leavepictureinpicture', handleLeavePIP);
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      };
    }, []);

    /**
     * Update srcObject.
     */
    useEffect(
      function updateSrcObject() {
        const video = videoEl.current;
        if (!video || !videoTrack) return;
        video.srcObject = new MediaStream([videoTrack]);
        video.load();
        return () => {
          // clean up when unmounted
          video.srcObject = null;
          video.load();
        };
      },
      [videoTrack, videoTrack?.id]
    );

    /**
     * Add optional event listener for resize event so the parent component
     * can know the video's native aspect ratio.
     */
    useEffect(
      function reportVideoDimensions() {
        const video = videoEl.current;
        if (!onResize || !video) return;

        let frame: ReturnType<typeof requestAnimationFrame>;
        function handleResize() {
          if (frame) cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const video = videoEl.current;
            if (!video || document.hidden) return;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            if (videoWidth && videoHeight) {
              onResize({
                aspectRatio: videoWidth / videoHeight,
                height: videoHeight,
                width: videoWidth,
              });
            }
          });
        }

        handleResize();
        video.addEventListener('loadedmetadata', handleResize);
        video.addEventListener('resize', handleResize);

        return () => {
          if (frame) cancelAnimationFrame(frame);
          video.removeEventListener('loadedmetadata', handleResize);
          video.removeEventListener('resize', handleResize);
        };
      },
      [onResize]
    );

    return (
      <video
        autoPlay
        muted
        playsInline
        ref={videoRef}
        data-local={isLocal}
        // Only set data-mirrored and data-playable when true
        data-mirrored={isMirrored || undefined}
        data-playable={isPlayable || undefined}
        data-session-id={sessionId}
        data-subscribed={subscribedState}
        data-video-type={type}
        style={{
          objectFit: fit,
          transform: isMirrored ? 'scale(-1, 1)' : '',
          ...style,
          ...(isPlayable ? playableStyle : {}),
        }}
        {...props}
      />
    );
  }
);
DailyVideo.displayName = 'DailyVideo';
