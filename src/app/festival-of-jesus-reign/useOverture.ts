"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The page's soundtrack: an MP3 that loops from the first press of Play
 * until the visitor presses Pause (Play again resumes where it stopped).
 * Nothing loads until that first press.
 *
 * The audio runs through Web Audio so the equalizer can follow it
 * (AnalyserNode), with a short fade in and out instead of a hard cut. The
 * file is served with Access-Control-Allow-Origin: *, which the analyser
 * needs: without it the browser would play silence through it.
 */
export function useOverture(src: string) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pauseTimer = useRef<number | null>(null);

  /** Audio element + graph, created on the first press (needs a user gesture). */
  const ensureGraph = useCallback(() => {
    if (audioRef.current && ctxRef.current) return true;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audio.preload = "auto";
    audio.src = src;
    audio.addEventListener("waiting", () => setLoading(true));
    audio.addEventListener("playing", () => setLoading(false));
    audio.addEventListener("error", () => {
      setLoading(false);
      setPlaying(false);
    });
    audioRef.current = audio;

    if (AC) {
      const ctx = new AC();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      ctx.createMediaElementSource(audio).connect(gain).connect(analyser).connect(ctx.destination);
      ctxRef.current = ctx;
      gainRef.current = gain;
      analyserRef.current = analyser;
    }
    return true;
  }, [src]);

  const fadeTo = (value: number, seconds: number) => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(value, now + seconds);
  };

  const play = useCallback(async () => {
    ensureGraph();
    const audio = audioRef.current!;
    if (pauseTimer.current) {
      window.clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
    }
    setPlaying(true);
    setLoading(audio.readyState < 3);
    try {
      await ctxRef.current?.resume();
      await audio.play();
      fadeTo(1, 1.2);
    } catch {
      // Blocked or failed to load: show Play again.
      setPlaying(false);
      setLoading(false);
    }
  }, [ensureGraph]);

  const pause = useCallback(() => {
    setPlaying(false);
    setLoading(false);
    const audio = audioRef.current;
    if (!audio) return;
    if (!ctxRef.current) {
      audio.pause();
      return;
    }
    // Fade out, then pause (keeps its place for the next Play).
    fadeTo(0, 0.5);
    pauseTimer.current = window.setTimeout(() => {
      audio.pause();
      pauseTimer.current = null;
    }, 520);
  }, []);

  const toggle = useCallback(() => (playing ? pause() : void play()), [playing, pause, play]);

  // Leaving the page stops the sound.
  useEffect(
    () => () => {
      if (pauseTimer.current) window.clearTimeout(pauseTimer.current);
      audioRef.current?.pause();
      void ctxRef.current?.close();
    },
    [],
  );

  return { playing, loading, toggle, analyserRef };
}
