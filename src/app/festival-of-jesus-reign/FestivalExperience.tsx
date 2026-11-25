"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image, { type ImageLoader } from "next/image";
import { m as motion } from "framer-motion";
import {
  CalendarPlus,
  MapPin,
  Music2,
  Pause,
  Phone,
  Share2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import styles from "./festival.module.css";
import { FESTIVAL, MAPS_QUERY } from "./eventInfo";
import { useOverture } from "./useOverture";

/**
 * Cloudinary resizes and converts these images itself (WebP/AVIF with
 * transparency, sized to each screen): the originals are 1.5–6 MB, too big
 * for Next's own optimizer to fetch in time.
 */
const cloudinaryLoader: ImageLoader = ({ src, width, quality }) =>
  src.replace("/upload/", `/upload/f_auto,q_${quality ?? "auto"},w_${width},c_limit/`);

/** The animated flag at a width; still = its first frame only. */
const flagUrl = (width: number, still = false) =>
  FESTIVAL.flag.replace(
    "/upload/",
    still
      ? `/upload/f_webp,pg_1,q_auto,w_${width}/`
      : `/upload/f_webp,fl_awebp,q_70,w_${width}/`,
  );

const START = new Date(FESTIVAL.startsAt).getTime();
const END = new Date(FESTIVAL.endsAt).getTime();
const BARS = 56;

/** A rooftop-like silhouette for the equalizer when it's idle (0.15–1). */
function skyline(i: number): number {
  const x = i / BARS;
  const v =
    0.45 +
    0.25 * Math.sin(x * Math.PI * 3.1 + 0.6) +
    0.18 * Math.sin(x * Math.PI * 9.7) +
    0.12 * Math.cos(x * Math.PI * 17.3);
  return Math.min(1, Math.max(0.15, v));
}

/** iCalendar file for "Add to calendar" (works with Google, Apple, Outlook). */
function downloadIcs(venueLine: string) {
  const stamp = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NLWC Ikorodu//Festival of Jesus' Reign//EN",
    "BEGIN:VEVENT",
    `UID:fjr-2026@ikorodu.nlwc.church`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(START)}`,
    `DTEND:${stamp(END)}`,
    `SUMMARY:${esc(FESTIVAL.name)}`,
    `LOCATION:${esc(venueLine)}`,
    `DESCRIPTION:${esc(`${FESTIVAL.tagline}. Attendance is free. Enquiries: ${FESTIVAL.phoneDisplay}`)}`,
    `URL:https://ikorodu.nlwc.church${FESTIVAL.path}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(FESTIVAL.name)} starts at 5PM`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "festival-of-jesus-reign.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function useCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // First tick on the next frame (the server render shows "--").
    const first = requestAnimationFrame(() => setNow(Date.now()));
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelAnimationFrame(first);
      window.clearInterval(id);
    };
  }, []);
  if (now === null) return null;
  const left = Math.max(0, START - now);
  return {
    phase: now < START ? "before" : now < END ? "live" : "after",
    days: Math.floor(left / 86_400_000),
    hours: Math.floor(left / 3_600_000) % 24,
    minutes: Math.floor(left / 60_000) % 60,
    seconds: Math.floor(left / 1000) % 60,
  } as const;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function FestivalExperience({ venueLine }: { venueLine: string }) {
  const { playing, toggle, analyserRef } = useOverture();
  const countdown = useCountdown();
  const bars = useMemo(() => Array.from({ length: BARS }, (_, i) => skyline(i)), []);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // While the music plays, the skyline follows it.
  useEffect(() => {
    if (!playing) {
      barRefs.current.forEach((el) => el && (el.style.transform = ""));
      return;
    }
    let raf = 0;
    const data = new Uint8Array(128);
    const draw = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(data);
        barRefs.current.forEach((el, i) => {
          if (!el) return;
          // Mirror the low/mid spectrum across the skyline from the centre.
          const d = Math.abs(i - BARS / 2) / (BARS / 2);
          const v = data[Math.floor(2 + d * 60)] / 255;
          el.style.transform = `scaleY(${Math.max(0.08, bars[i] * 0.35 + v * 0.9)})`;
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [playing, analyserRef, bars]);

  // Always the public address, so shared links work wherever they're opened.
  const pageUrl = `https://ikorodu.nlwc.church${FESTIVAL.path}`;
  const inviteText = `Join me at the ${FESTIVAL.name}: ${FESTIVAL.dateLabel}, ${FESTIVAL.timeLabel} at ${FESTIVAL.venue.name}, ${FESTIVAL.venue.area}, Ikorodu. Attendance is free.`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: FESTIVAL.name, text: inviteText, url: pageUrl });
      } catch {
        // Closed the share sheet: nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(`${inviteText} ${pageUrl}`);
    toast.success("Invitation copied. Paste it into any chat.");
  };

  const directions = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

  return (
    <div className={styles.root}>
      {/* ── The stage ─────────────────────────────────────────────────── */}
      <section className={styles.stage} aria-labelledby="fjr-title">
        <div className={`${styles.letterbox} ${styles.letterboxTop}`} aria-hidden="true" />
        <div className={`${styles.letterbox} ${styles.letterboxBottom}`} aria-hidden="true" />
        <div className={`${styles.beam} ${styles.beamLeft}`} aria-hidden="true" />
        <div className={`${styles.beam} ${styles.beamRight}`} aria-hidden="true" />
        <div className={styles.haze} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8 pt-16 pb-[30vh] sm:pb-[28vh] text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className={`${styles.label} text-(--lace-dim)`}
          >
            {FESTIVAL.hosts[0]} &nbsp;×&nbsp; {FESTIVAL.hosts[1]} present
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="mt-6 text-lg sm:text-xl text-(--gold) font-semibold"
          >
            {FESTIVAL.tagline}
          </motion.p>

          <h1 id="fjr-title" className={`${styles.display} mt-3 leading-[0.9]`}>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
              className="block text-3xl sm:text-5xl md:text-6xl"
            >
              Festival of
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40, letterSpacing: "0.12em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "-0.01em" }}
              transition={{ delay: 1.95, duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
              className={`${styles.titleGlow} block text-[3.6rem] sm:text-[7rem] md:text-[9.5rem] mt-1`}
            >
              Jesus&rsquo; Reign
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.8 }}
          >
            <p className={`${styles.mono} mt-8 text-sm sm:text-base text-(--lace-dim)`}>
              WED 23 DEC 2026 &nbsp;·&nbsp; 5PM &nbsp;·&nbsp; {FESTIVAL.venue.name.toUpperCase()}, IKORODU
            </p>
            <p className="mt-3 inline-block rounded-full border border-(--gold)/50 px-4 py-1 text-sm font-semibold text-(--gold)">
              Attendance is free
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={toggle}
                aria-pressed={playing}
                className={`${styles.btn} ${styles.btnGold}`}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
                {playing ? "Stop the sound" : "Play the sound"}
              </button>
              <button
                type="button"
                onClick={() => downloadIcs(venueLine)}
                className={`${styles.btn} ${styles.btnGhost}`}
              >
                <CalendarPlus className="w-5 h-5" />
                Add to calendar
              </button>
            </div>
          </motion.div>
        </div>

        {/* Equalizer skyline: idles like a city at night, dances to the sound. */}
        <div className={`${styles.eq} ${playing ? "" : styles.eqIdle}`} aria-hidden="true">
          {bars.map((h, i) => (
            <span
              key={i}
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              className={styles.eqBar}
              style={{
                ["--h" as string]: h,
                transform: `scaleY(${h})`,
                animationDelay: `${(i % 7) * -0.35}s`,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Countdown as a film timecode ─────────────────────────────── */}
      <section id="countdown" className={styles.timecodeStrip} aria-label="Countdown">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 sm:flex-row sm:justify-between sm:px-8">
          <p className={`${styles.label} flex items-center gap-3 text-(--lace-dim)`}>
            <span className={styles.rec} aria-hidden="true" />
            {countdown?.phase === "live"
              ? "Happening now"
              : countdown?.phase === "after"
                ? "Thank you for celebrating with us"
                : "We begin in"}
          </p>
          {countdown?.phase !== "after" && (
            <div
              role="timer"
              aria-label={`Starts ${FESTIVAL.dateLabel} at ${FESTIVAL.timeLabel}`}
              className={`${styles.mono} flex items-end gap-2 sm:gap-4`}
            >
              {(
                [
                  ["days", countdown?.days],
                  ["hrs", countdown?.hours],
                  ["min", countdown?.minutes],
                  ["sec", countdown?.seconds],
                ] as const
              ).map(([label, value], i) => (
                <div key={label} className="flex items-end gap-2 sm:gap-4">
                  {i > 0 && <span className="pb-6 text-2xl text-(--crimson)">:</span>}
                  <div className="text-center">
                    <div className="text-4xl sm:text-6xl font-semibold text-(--lace)">
                      {value === undefined ? "--" : pad(value)}
                    </div>
                    <div className={`${styles.label} mt-1 text-(--lace-dim)`}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Ticket + map ─────────────────────────────────────────────── */}
      <section id="details" className="bg-(--night) px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-stretch">
          <div className={styles.ticket}>
            <div className={styles.stub}>
              <p className={styles.label}>Admit all</p>
              <p className={`${styles.display} text-5xl leading-none`}>Free</p>
              <p className="text-sm text-(--lace)/85">No ticket or registration needed. Just come.</p>
              <span className={`${styles.notch} -bottom-3 -left-3 md:-left-3 md:-top-3 md:bottom-auto md:left-auto md:-right-3`} aria-hidden="true" />
              <span className={`${styles.notch} -bottom-3 -right-3`} aria-hidden="true" />
            </div>
            <dl className="grid gap-6 p-7 sm:p-9">
              <div>
                <dt className={`${styles.label} text-(--crimson)`}>When</dt>
                <dd className={`${styles.display} mt-1 text-2xl sm:text-3xl`}>{FESTIVAL.dateLabel}</dd>
                <dd className="mt-1 font-semibold">Starts {FESTIVAL.timeLabel}</dd>
              </div>
              <div>
                <dt className={`${styles.label} text-(--crimson)`}>Where</dt>
                <dd className={`${styles.display} mt-1 text-2xl sm:text-3xl`}>{FESTIVAL.venue.name}</dd>
                <dd className="mt-1 text-[0.95rem] leading-relaxed text-(--night)/80">
                  {FESTIVAL.venue.street}, {FESTIVAL.venue.area}, {FESTIVAL.venue.city}, {FESTIVAL.venue.region}
                </dd>
              </div>
              <div>
                <dt className={`${styles.label} text-(--crimson)`}>Enquiries</dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${FESTIVAL.phoneTel}`}
                    className="inline-flex items-center gap-2 font-semibold underline decoration-(--crimson) decoration-2 underline-offset-4"
                  >
                    <Phone className="w-4 h-4" />
                    {FESTIVAL.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btn} bg-(--night) text-(--lace) hover:bg-(--night-deep)`}
                >
                  <MapPin className="w-5 h-5" />
                  Get directions
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcs(venueLine)}
                  className={`${styles.btn} border border-(--night)/25 hover:bg-(--night)/5`}
                >
                  <CalendarPlus className="w-5 h-5" />
                  Add to calendar
                </button>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-3xl border border-(--hairline) min-h-80">
            <iframe
              title={`Map: ${FESTIVAL.venue.name}, ${FESTIVAL.venue.area}, Ikorodu`}
              src={`https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className={`${styles.mapFrame} h-full min-h-80 w-full`}
            />
          </div>
        </div>
      </section>

      {/* ── The banner on its own stage ──────────────────────────────── */}
      <section id="banner" className={`${styles.spotlightFloor} overflow-hidden py-20 sm:py-28`}>
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {/* The flag is an animated WebP (it billows on a loop). Cloudinary
                resizes it with the animation kept (fl_awebp); visitors who ask
                for less motion get its first frame as a still. A plain
                <picture> because next/image can't switch on a media query. */}
            <picture>
              <source
                media="(prefers-reduced-motion: reduce)"
                srcSet={[480, 720, 960].map((w) => `${flagUrl(w, true)} ${w}w`).join(", ")}
                sizes="(max-width: 1024px) 92vw, 960px"
              />
              { }
              <img
                src={flagUrl(720)}
                srcSet={[480, 720, 960].map((w) => `${flagUrl(w)} ${w}w`).join(", ")}
                sizes="(max-width: 1024px) 92vw, 960px"
                width={1536}
                height={1024}
                loading="lazy"
                decoding="async"
                alt={`${FESTIVAL.name} banner carried on a flag: Join us as the City of Ikorodu celebrates. 23rd December 2026, 5PM at Life Theological Seminary, Oke Otta-Ona, Ikorodu. Attendance is free. Enquiries 0813 743 6770.`}
                className="mx-auto h-auto w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
              />
            </picture>
          </motion.div>
        </div>
        <div className="mt-14 border-y border-(--hairline) py-4" aria-hidden="true">
          <div className={styles.marquee}>
            {Array.from({ length: 2 }, (_, k) => (
              <span key={k} className={`${styles.display} flex shrink-0 items-center gap-10 pr-10 text-3xl sm:text-5xl`}>
                {["Jesus reigns", "Ikorodu celebrates", "23 · 12 · 2026", "Jesus reigns", "Come as you are", "5PM"].map((w, i) => (
                  <span key={i} className="flex items-center gap-10">
                    <span className={i % 2 ? "text-(--lace)/80" : styles.titleGlow}>{w}</span>
                    <span className="text-(--gold)">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Invite ───────────────────────────────────────────────────── */}
      <section id="invite" className="bg-(--night-deep) px-5 py-20 text-center sm:px-8 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <p className={`${styles.label} text-(--gold)`}>Bring someone along</p>
          <h2 className={`${styles.display} mt-4 text-4xl sm:text-6xl leading-[0.95]`}>
            A whole city, one celebration.
          </h2>
          <p className="mt-5 text-lg text-(--lace-dim)">
            Send the invitation to family, friends and neighbours in Ikorodu.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${inviteText} ${pageUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btn} ${styles.btnGold}`}
            >
              <MessageCircle className="w-5 h-5" />
              Invite on WhatsApp
            </a>
            <button type="button" onClick={share} className={`${styles.btn} ${styles.btnGhost}`}>
              <Share2 className="w-5 h-5" />
              Share the invitation
            </button>
          </div>
        </div>

        {/* The city on its way: three festival-goers step onto the stage. */}
        <div className={`${styles.crowdFloor} mx-auto mt-16 flex max-w-4xl items-end justify-center`}>
          {FESTIVAL.crowd.map((person, i) => (
            <motion.figure
              key={person.src}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: 0.15 + i * 0.18, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
              className={`${styles.person} ${i === 1 ? "z-10" : "z-0"}`}
            >
              <div className={styles.personBob} style={{ animationDelay: `${i * -1.1}s` }}>
                <Image
                  src={person.src}
                  loader={cloudinaryLoader}
                  alt={person.alt}
                  width={800}
                  height={1200}
                  sizes="(max-width: 640px) 34vw, 260px"
                  className={`h-auto w-full select-none ${i === 1 ? "scale-105" : ""}`}
                  draggable={false}
                />
              </div>
            </motion.figure>
          ))}
        </div>

        <div className="mx-auto max-w-2xl">
          <p className={`${styles.label} mt-12 text-(--lace-dim)`}>
            In partnership: {FESTIVAL.hosts[0]} · {FESTIVAL.hosts[1]}
          </p>
        </div>
      </section>
    </div>
  );
}
