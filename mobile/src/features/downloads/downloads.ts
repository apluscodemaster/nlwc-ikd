/**
 * Offline sermons: audio saved to the app's document folder (not the cache,
 * which the OS may clear), so a message plays without data. The player uses
 * the saved file whenever there is one (see PlayerProvider).
 *
 * The index (what is saved, with its title etc.) lives in kv; the files are
 * the truth: an entry whose file has gone is dropped.
 */
import { useSyncExternalStore } from "react";
import { Directory, File, Paths } from "expo-file-system";
import { kv } from "~/lib/storage";
import type { Track } from "~/player/types";

const INDEX_KEY = "nlwc-downloads";

export interface DownloadedSermon {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  href?: string;
  /** file:// URI of the saved audio. */
  uri: string;
  /** Bytes. */
  size: number;
  /** ISO timestamp. */
  downloadedAt: string;
}

interface State {
  items: DownloadedSermon[];
  /** Download progress 0..1 by sermon id, while downloading. */
  active: Record<string, number>;
}

type Index = Record<string, DownloadedSermon>;

const listeners = new Set<() => void>();
const controllers = new Map<string, AbortController>();
/** Downloads the listener cancelled (so their failure isn't reported). */
const cancelled = new Set<string>();
let active: Record<string, number> = {};
let snapshot: State = { items: [], active };

function readIndex(): Index {
  return kv.getJSON<Index>(INDEX_KEY) ?? {};
}

function writeIndex(index: Index) {
  kv.setJSON(INDEX_KEY, index);
}

function fileExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

function emit() {
  const items = Object.values(readIndex()).sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
  snapshot = { items, active: { ...active } };
  listeners.forEach((l) => l());
}

function folder(): Directory {
  const dir = new Directory(Paths.document, "sermons");
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function extensionOf(url: string): string {
  const m = /\.(mp3|m4a|aac|wav|ogg)(?:$|[?#])/i.exec(url);
  return m ? m[1].toLowerCase() : "mp3";
}

/** The saved file for a sermon, or null (also cleans up a missing file). */
export function getDownload(id: Track["id"]): DownloadedSermon | null {
  const index = readIndex();
  const entry = index[String(id)];
  if (!entry) return null;
  if (fileExists(entry.uri)) return entry;
  delete index[String(id)];
  writeIndex(index);
  emit();
  return null;
}

/** Save a sermon's audio for offline listening. Resolves false when cancelled or failed. */
export async function downloadSermon(track: Track): Promise<boolean> {
  const id = String(track.id);
  // Only web URLs (a playing download's track URL is its own file).
  if (!/^https?:\/\//i.test(track.url) || track.isLive || controllers.has(id)) return false;
  const controller = new AbortController();
  controllers.set(id, controller);
  cancelled.delete(id);
  active = { ...active, [id]: 0 };
  emit();
  const target = new File(folder(), `${id}.${extensionOf(track.url)}`);
  try {
    const file = await File.downloadFileAsync(track.url, target, {
      idempotent: true,
      signal: controller.signal,
      onProgress: ({ bytesWritten, totalBytes }) => {
        if (totalBytes <= 0) return; // -1: server sent no size
        active = { ...active, [id]: Math.min(1, bytesWritten / totalBytes) };
        emit();
      },
    });
    const index = readIndex();
    index[id] = {
      id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.artwork,
      href: track.href,
      uri: file.uri,
      size: file.size ?? 0,
      downloadedAt: new Date().toISOString(),
    };
    writeIndex(index);
    return true;
  } catch (err) {
    if (!controller.signal.aborted) console.warn("[downloads] failed:", err);
    try {
      if (target.exists) target.delete();
    } catch {
      /* partial file: nothing more to do */
    }
    return false;
  } finally {
    controllers.delete(id);
    const { [id]: _done, ...rest } = active;
    active = rest;
    emit();
  }
}

export function cancelDownload(id: Track["id"]) {
  const controller = controllers.get(String(id));
  if (!controller) return;
  cancelled.add(String(id));
  controller.abort();
}

/** True (once) when the listener cancelled this sermon's last download. */
export function wasCancelled(id: Track["id"]): boolean {
  return cancelled.delete(String(id));
}

export function removeDownload(id: Track["id"]) {
  const index = readIndex();
  const entry = index[String(id)];
  if (!entry) return;
  try {
    const file = new File(entry.uri);
    if (file.exists) file.delete();
  } catch {
    /* already gone */
  }
  delete index[String(id)];
  writeIndex(index);
  emit();
}

/** Space the saved sermons take, in bytes. */
export function downloadsSize(items: DownloadedSermon[]): number {
  return items.reduce((sum, d) => sum + (d.size || 0), 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let initialised = false;
function getSnapshot(): State {
  if (!initialised) {
    initialised = true;
    // Drop entries whose files were removed outside the app.
    const index = readIndex();
    let changed = false;
    for (const [id, entry] of Object.entries(index)) {
      if (!fileExists(entry.uri)) {
        delete index[id];
        changed = true;
      }
    }
    if (changed) writeIndex(index);
    snapshot = {
      items: Object.values(index).sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt)),
      active,
    };
  }
  return snapshot;
}

/** Saved sermons and in-progress downloads; re-renders on change. */
export function useDownloads(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
