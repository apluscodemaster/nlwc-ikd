"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A short looping groove synthesised in the browser (no audio file): warm
 * pad chords G – Em – C – D, a bass note, a talking-drum style pitch-bend
 * hit on a syncopated pattern, and a soft shaker. It only starts when the
 * visitor presses play (browsers require that anyway) and fades in and out.
 *
 * Exposes the AnalyserNode so the page's equalizer can follow the music.
 */

const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
/** Chord tones in Hz (roots around G2–D3, voiced in the 3rd octave). */
const CHORDS: { root: number; tones: number[] }[] = [
  { root: 98.0, tones: [196.0, 246.94, 293.66, 392.0] }, // G
  { root: 82.41, tones: [164.81, 196.0, 246.94, 329.63] }, // Em
  { root: 65.41, tones: [196.0, 261.63, 329.63, 392.0] }, // C
  { root: 73.42, tones: [220.0, 293.66, 369.99, 440.0] }, // D
];
/** Talking-drum hits, in beats within the bar. */
const DRUM = [0, 1.5, 2, 3, 3.5];

export function useOverture() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextBarRef = useRef(0);
  const barIndexRef = useRef(0);
  const noiseRef = useRef<AudioBuffer | null>(null);

  const scheduleBar = useCallback((ctx: AudioContext, out: AudioNode, t: number, i: number) => {
    const chord = CHORDS[i % CHORDS.length];

    // Pad: two slightly detuned saws per tone, through a soft low-pass.
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.setValueAtTime(900, t);
    padFilter.frequency.linearRampToValueAtTime(1500, t + BAR * 0.5);
    padFilter.frequency.linearRampToValueAtTime(900, t + BAR);
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0, t);
    padGain.gain.linearRampToValueAtTime(0.05, t + 0.6);
    padGain.gain.setValueAtTime(0.05, t + BAR - 0.4);
    padGain.gain.linearRampToValueAtTime(0, t + BAR + 0.8);
    padFilter.connect(padGain).connect(out);
    for (const f of chord.tones) {
      for (const detune of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(padFilter);
        o.start(t);
        o.stop(t + BAR + 1);
      }
    }

    // Bass on beats 1 and 3.
    for (const beat of [0, 2]) {
      const s = t + beat * BEAT;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = chord.root;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.35, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + BEAT * 1.6);
      o.connect(g).connect(out);
      o.start(s);
      o.stop(s + BEAT * 1.7);
    }

    // Talking drum: a pitch that bends down, like a squeezed dùndún.
    for (const beat of DRUM) {
      const s = t + beat * BEAT;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      const high = beat === 3.5 ? 260 : 200;
      o.frequency.setValueAtTime(high, s);
      o.frequency.exponentialRampToValueAtTime(high * 0.55, s + 0.22);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.4, s + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.3);
      o.connect(g).connect(out);
      o.start(s);
      o.stop(s + 0.32);
    }

    // Shaker on every eighth note, accent on the off-beats.
    if (noiseRef.current) {
      for (let k = 0; k < 8; k++) {
        const s = t + k * (BEAT / 2);
        const src = ctx.createBufferSource();
        src.buffer = noiseRef.current;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 6500;
        const g = ctx.createGain();
        const level = k % 2 ? 0.06 : 0.03;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(level, s + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.07);
        src.connect(hp).connect(g).connect(out);
        src.start(s);
        src.stop(s + 0.08);
      }
    }
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    if (!ctx || !masterRef.current) return;
    const now = ctx.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
    masterRef.current.gain.linearRampToValueAtTime(0, now + 0.8);
    window.setTimeout(() => {
      void ctx.close();
      if (ctxRef.current === ctx) {
        ctxRef.current = null;
        analyserRef.current = null;
      }
    }, 900);
  }, []);

  const start = useCallback(() => {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 1.5);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    master.connect(analyser).connect(ctx.destination);

    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseRef.current = noise;

    ctxRef.current = ctx;
    masterRef.current = master;
    analyserRef.current = analyser;
    nextBarRef.current = ctx.currentTime + 0.1;
    barIndexRef.current = 0;

    // Look-ahead scheduler: queue each bar shortly before it is due.
    const tick = () => {
      while (nextBarRef.current < ctx.currentTime + 0.5) {
        scheduleBar(ctx, master, nextBarRef.current, barIndexRef.current++);
        nextBarRef.current += BAR;
      }
    };
    tick();
    timerRef.current = window.setInterval(tick, 100);
    setPlaying(true);
  }, [scheduleBar]);

  const toggle = useCallback(() => (playing ? stop() : start()), [playing, start, stop]);

  // Leaving the page stops the sound.
  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      void ctxRef.current?.close();
    },
    [],
  );

  return { playing, toggle, analyserRef };
}
