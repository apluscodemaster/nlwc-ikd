"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Church,
  FileText,
  BookOpen,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Music,
  Eye,
  Calendar,
  User,
  X,
  RefreshCw,
  Plus,
  FileAudio,
  ImagePlus,
  Pencil,
  Save,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Layers,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Link as LinkIcon,
  Quote,
} from "lucide-react";
import { showPrompt } from "@/components/shared/CustomDialog";
import { CustomDatePicker } from "@/components/shared/CustomDatePicker";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SelectField } from "@/components/shared/SelectField";
import { Button } from "@/components/ui/button";
import ManualThemeBoard from "@/components/admin/ManualThemeBoard";
import { cleanInlineStyles } from "@/utils/sanitizeWP";
import { getAuthorizationHeader } from "@/lib/authClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type ContentType = "sermon" | "transcript" | "manual";
type ViewMode = "create" | "list";

const pad2 = (n: number | string) => String(n).padStart(2, "0");

/** Combine a YYYY-MM-DD date with hour/minute into a local naive datetime
 *  string (YYYY-MM-DDTHH:mm:00) for the WordPress `date` field. */
function combinePublishDate(
  date: string,
  hour: string,
  minute: string,
): string | null {
  if (!date) return null;
  return `${date}T${pad2(hour)}:${pad2(minute)}:00`;
}

/** Convert any date string (a formatted label like "January 5, 2025" or an ISO
 *  string) to a YYYY-MM-DD value for the date picker, using LOCAL calendar
 *  parts so the day never shifts by one (toISOString would convert to UTC). */
function toDateInputValue(value?: string): string {
  if (!value) return "";
  // A naive WordPress timestamp ("2026-07-28T00:15:00") carries no zone; take
  // its calendar parts literally instead of letting Date reinterpret them.
  const naive = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
  if (naive) return naive[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Read the wall-clock time out of a WordPress timestamp.
 *
 *  WordPress stores `post.date` as naive site-local time with no offset, so it
 *  must be read literally — `new Date(...)` would apply the browser's zone and
 *  shift the hour. Returns hour/minute as the strings the selects expect, with
 *  the minute snapped down to the nearest 5 to match the available options. */
function toTimeInputValues(value?: string): { hour: string; minute: string } | null {
  if (!value) return null;
  const m = /T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour: String(hour), minute: String(Math.floor(minute / 5) * 5) };
}

/**
 * Remove a single leading "Minister:/Speaker:" line from transcript/manual body
 * HTML, if one is present, so it can be re-derived from the speaker dropdown on
 * save.
 *
 * This is deliberately START-ANCHORED and matched against ONE leading node only.
 * The previous approach used a global, unanchored sweep
 * (`/(?:Minister|Speaker):\s*[^\n]*\n?/g`) that deleted everything from the first
 * "Minister:"/"Speaker:" occurrence to the next newline — when the leading
 * paragraph's markup varied even slightly, that ate the closing `</strong></p>`
 * and left a dangling `<p><strong>`, which rendered the rest of the document
 * bold and injected a stray "p>". Anchoring to the start makes it impossible to
 * touch the body: if the first node isn't a Minister/Speaker line, nothing is
 * removed.
 */
function stripLeadingSpeakerLine(html: string): string {
  const out = html.replace(/^\s+/, "");
  // A leading paragraph whose text begins with Minister/Speaker, allowing any
  // emphasis wrapper (<strong>/<b>/<em>/<i>/<span>) and attributes. Non-greedy
  // up to the FIRST </p>, so only that one paragraph is removed.
  const leadingParagraph =
    /^<p\b[^>]*>(?:\s|<(?:strong|b|em|i|span)\b[^>]*>)*\s*(?:Minister|Speaker)\s*:[\s\S]*?<\/p>\s*/i;
  if (leadingParagraph.test(out)) return out.replace(leadingParagraph, "");
  // A leading bare "Minister: …" line (manuals / plain text). `[^\n<]*` stops at
  // the first newline or tag, so only the label line itself is removed.
  const leadingBare =
    /^(?:<(?:strong|b|em|i|span)\b[^>]*>)*\s*(?:Minister|Speaker)\s*:[^\n<]*(?:<br\s*\/?>)?\s*/i;
  return out.replace(leadingBare, "");
}

interface SermonFormData {
  title: string;
  status: "draft" | "publish";
  speaker: string;
  seriesId: string;
  description: string;
  sermonDate: string;
  /** S3 (or other) URL of the MP3 — audio is NOT hosted on WordPress. */
  audioUrl: string;
  thumbnailFile: FileList | null;
}

type TranscriptType =
  | "sunday-message"
  | "sunday-school"
  | "bible-study"
  | "other-meetings"
  | "season-of-the-spirit";

// Map transcript types to WP category IDs for save operations
const TRANSCRIPT_TYPE_TO_CATEGORY: Record<TranscriptType, number> = {
  "sunday-message": 20,
  "sunday-school": 31,
  "bible-study": 33,
  "other-meetings": 21,
  "season-of-the-spirit": 22,
};

// Map WP category IDs back to transcript type slugs
const CATEGORY_TO_TRANSCRIPT_TYPE: Record<number, TranscriptType> = {
  20: "sunday-message",
  31: "sunday-school",
  33: "bible-study",
  21: "other-meetings",
  22: "season-of-the-spirit",
};

interface TextFormData {
  title: string;
  content: string;
  status: "draft" | "publish";
  speaker: string;
  transcriptType: TranscriptType;
  /** Scheduling: when publishDate+time is in the future and status is
   *  "publish", WordPress stores the post as "future" (scheduled) and
   *  auto-publishes at the chosen moment. */
  publishDate: string; // YYYY-MM-DD
  publishHour: string; // "0".."23"
  publishMinute: string; // "0", "5", ... "55"
}

interface ContentItem {
  id: number;
  title: string;
  date: string;
  status: string;
  speaker?: string;
  type: string;
  excerpt?: string;
  content?: string;
  audioUrl?: string;
  thumbnail?: string;
  series?: string;
  transcriptType?: string;
  slug?: string;
  /** Raw WP timestamp ("YYYY-MM-DDTHH:mm:ss", naive site-local). `date` is a
   *  display label with no time, so editing needs this to keep the schedule. */
  dateIso?: string;
  /** Manual theme/series (resolved: meta override ?? parsed "THEME:" label). */
  theme?: string;
  /** Manual lesson label parsed from the excerpt. */
  lesson?: string;
}

interface SpeakerItem {
  id: number;
  name: string;
  messageCount: number;
}

interface SeriesItem {
  id: number;
  title: string;
  messageCount: number;
}

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS: {
  id: ContentType;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}[] = [
  {
    id: "sermon",
    label: "Sermons",
    icon: Church,
    description: "Audio messages",
    color: "from-primary to-amber-500",
  },
  {
    id: "transcript",
    label: "Transcripts",
    icon: FileText,
    description: "Sunday Message, Bible Study & Sunday School Transcripts",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "manual",
    label: "Manuals",
    icon: BookOpen,
    description: "Sunday School manuals",
    color: "from-emerald-500 to-teal-500",
  },
];

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

/** Block formats offered by the editor's format dropdown. Every tag here is
 *  serialized to a native Gutenberg block by htmlToGutenbergBlocks(). */
const BLOCK_FORMATS = [
  { tag: "p", label: "Paragraph" },
  { tag: "h1", label: "Heading 1" },
  { tag: "h2", label: "Heading 2" },
  { tag: "h3", label: "Heading 3" },
  { tag: "h4", label: "Heading 4" },
  { tag: "h5", label: "Heading 5" },
  { tag: "h6", label: "Heading 6" },
  { tag: "blockquote", label: "Quote" },
  { tag: "pre", label: "Preformatted" },
] as const;

const BLOCK_FORMAT_TAGS = new Set(BLOCK_FORMATS.map((f) => f.tag as string));

function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  // Which block format the caret currently sits in, so the dropdown reflects
  // the selection instead of always showing "Paragraph".
  const [blockFormat, setBlockFormat] = useState("p");
  // Opening the format dropdown moves focus out of the editor and clears the
  // selection, so stash it on mousedown and restore it before applying.
  const pendingSelection = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  // Strip external formatting on paste (Word / Google Docs etc.) so the app's
  // own typography wins. Structural tags (headings, paragraphs, lists) and
  // emphasis (bold/italic/alignment) are kept; font-family, colors, sizes,
  // classes and Office cruft are removed.
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (!html && !text) return;
    e.preventDefault();

    if (html) {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      tmp
        .querySelectorAll("style, script, meta, link, title")
        .forEach((n) => n.remove());
      tmp.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("class");
        el.removeAttribute("lang");
        el.removeAttribute("face");
      });
      document.execCommand("insertHTML", false, cleanInlineStyles(tmp.innerHTML));
    } else {
      document.execCommand("insertText", false, text);
    }
    handleInput();
  };

  const saveSelection = (): Range | null => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) return sel.getRangeAt(0).cloneRange();
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (!range) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const execBasicCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    handleInput();
  };

  const focusEditor = () => editorRef.current?.focus();

  /** Read the block format under the caret. Browsers report the default block
   *  as "div" or "" — both mean "paragraph" here. */
  const currentBlockFormat = (): string => {
    let tag = "";
    try {
      tag = document.queryCommandValue("formatBlock")?.toLowerCase() ?? "";
    } catch {
      /* queryCommandValue can throw when there is no selection */
    }
    return BLOCK_FORMAT_TAGS.has(tag) ? tag : "p";
  };

  const syncBlockFormat = () => setBlockFormat(currentBlockFormat());

  // All formatting goes through document.execCommand: it acts on the current
  // selection/cursor (so lists apply to the active line, not the whole doc) and
  // participates in the browser's native undo/redo stack (Ctrl+Z / Ctrl+Y).
  const formatBlock = (tag: string) => {
    focusEditor();
    const current = currentBlockFormat();
    document.execCommand(
      "formatBlock",
      false,
      current === tag.toLowerCase() ? "<p>" : `<${tag}>`,
    );
    handleInput();
    syncBlockFormat();
  };

  /** Set (never toggle) the block format — the dropdown always states an
   *  absolute choice, unlike the toggle buttons. */
  const applyBlockFormat = (tag: string) => {
    focusEditor();
    document.execCommand("formatBlock", false, `<${tag}>`);
    handleInput();
    syncBlockFormat();
  };

  const insertList = (ordered: boolean) => {
    focusEditor();
    document.execCommand(
      ordered ? "insertOrderedList" : "insertUnorderedList",
      false,
    );
    if (ordered && editorRef.current) {
      // Browsers "continue" a new ordered list from a previous one by adding a
      // `start` attribute (or by splitting one list into two numbered blocks).
      // Strip it so every separate <ol> numbers from 1, while items kept inside
      // one list still flow normally.
      editorRef.current
        .querySelectorAll("ol[start]")
        .forEach((ol) => ol.removeAttribute("start"));
    }
    handleInput();
  };

  const setAlignment = (align: "left" | "center" | "right" | "justify") => {
    focusEditor();
    const cmd =
      align === "left"
        ? "justifyLeft"
        : align === "center"
          ? "justifyCenter"
          : align === "right"
            ? "justifyRight"
            : "justifyFull";
    document.execCommand(cmd, false);
    handleInput();
  };

  const insertLink = async () => {
    const savedRange = saveSelection();
    const url = await showPrompt("Enter the URL for the link:", {
      title: "Insert Link",
      placeholder: "https://example.com",
      confirmLabel: "Insert",
    });
    if (!url) {
      restoreSelection(savedRange);
      return;
    }

    focusEditor();
    restoreSelection(savedRange);

    const sel = window.getSelection();
    if (sel && sel.toString()) {
      document.execCommand("createLink", false, url);
    } else {
      document.execCommand("insertHTML", false, `<a href="${url}">${url}</a>`);
    }
    handleInput();
  };

  const toolbarButtons = [
    { icon: Bold, action: () => execBasicCommand("bold"), title: "Bold" },
    { icon: Italic, action: () => execBasicCommand("italic"), title: "Italic" },
    {
      icon: UnderlineIcon,
      action: () => execBasicCommand("underline"),
      title: "Underline",
    },
    { icon: null, action: null, title: "divider" },
    { icon: Quote, action: () => formatBlock("blockquote"), title: "Quote" },
    { icon: null, action: null, title: "divider" },
    { icon: List, action: () => insertList(false), title: "Bullet List" },
    {
      icon: ListOrdered,
      action: () => insertList(true),
      title: "Numbered List",
    },
    { icon: null, action: null, title: "divider" },
    {
      icon: AlignLeft,
      action: () => setAlignment("left"),
      title: "Align Left",
    },
    {
      icon: AlignCenter,
      action: () => setAlignment("center"),
      title: "Center",
    },
    {
      icon: AlignJustify,
      action: () => setAlignment("justify"),
      title: "Justify",
    },
    { icon: null, action: null, title: "divider" },
    { icon: LinkIcon, action: () => insertLink(), title: "Insert Link" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/80">
        <SelectField
          aria-label="Text format"
          value={blockFormat}
          // onMouseDown would otherwise blur the editor and drop the selection
          // the format is about to be applied to.
          onMouseDown={() => {
            pendingSelection.current = saveSelection();
          }}
          onChange={(e) => {
            focusEditor();
            restoreSelection(pendingSelection.current);
            applyBlockFormat(e.target.value);
          }}
          className="h-9 pl-3 pr-8 text-xs font-medium bg-white"
          chevronClassName="right-2 w-3.5 h-3.5"
          wrapperClassName="w-36"
        >
          {BLOCK_FORMATS.map((f) => (
            <option key={f.tag} value={f.tag}>
              {f.label}
            </option>
          ))}
        </SelectField>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {toolbarButtons.map((btn, i) => {
          if (btn.title === "divider") {
            return (
              <div key={`div-${i}`} className="w-px h-5 bg-gray-200 mx-1" />
            );
          }
          const Icon = btn.icon!;
          return (
            <button
              key={btn.title + i}
              type="button"
              title={btn.title}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => btn.action?.()}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors cursor-pointer"
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={() => {
          handleInput();
          syncBlockFormat();
        }}
        onPaste={handlePaste}
        onKeyUp={syncBlockFormat}
        onMouseUp={syncBlockFormat}
        onFocus={syncBlockFormat}
        data-placeholder={placeholder}
        className="min-h-[280px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400
          [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
          [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
          [&_p]:leading-relaxed
          [&_a]:text-blue-600 [&_a]:underline
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-2
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
          [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1.5
          [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-3 [&_h5]:mb-1.5
          [&_h6]:text-xs [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:mt-3 [&_h6]:mb-1.5
          [&_pre]:bg-gray-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:whitespace-pre-wrap"
        style={{ wordBreak: "break-word" }}
      />
    </div>
  );
}

// ─── Content List Item ────────────────────────────────────────────────────────
function ContentListItem({
  item,
  type,
  onEdit,
}: {
  item: ContentItem;
  type: ContentType;
  onEdit?: (item: ContentItem) => void;
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
      {type === "sermon" && item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
            type === "sermon"
              ? "from-primary/10 to-amber-500/10"
              : type === "transcript"
                ? "from-blue-500/10 to-indigo-500/10"
                : "from-emerald-500/10 to-teal-500/10"
          }`}
        >
          {type === "sermon" ? (
            <Music className="w-5 h-5 text-primary" />
          ) : type === "transcript" ? (
            <FileText className="w-5 h-5 text-blue-500" />
          ) : (
            <BookOpen className="w-5 h-5 text-emerald-500" />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
          {item.title}
        </h4>
        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1.5">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.date}
          </span>
          {item.speaker && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {item.speaker}
            </span>
          )}
          {item.series && (
            <span className="text-xs text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full">
              {item.series}
            </span>
          )}
          {item.transcriptType && (
            <span className="text-xs text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
              {item.transcriptType.replace("-", " ")}
            </span>
          )}
        </div>
        {item.excerpt && (
          <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 italic">
            {item.excerpt}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="w-8 h-8 flex items-center justify-center rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-primary/10 text-gray-400 hover:text-primary transition-all cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <StatusBadge
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
            item.status === "publish"
              ? "bg-emerald-50 text-emerald-600"
              : item.status === "future"
                ? "bg-blue-50 text-blue-600"
                : "bg-amber-50 text-amber-600"
          }`}
        >
          {item.status === "publish"
            ? "Live"
            : item.status === "future"
              ? "Scheduled"
              : "Draft"}
        </StatusBadge>
      </div>
    </div>
  );
}

// ─── Publish date & time (with scheduling) ──────────────────────────────────
function PublishScheduleField({ form }: { form: UseFormReturn<TextFormData> }) {
  const { control, register, watch } = form;
  const publishDate = watch("publishDate");
  const publishHour = watch("publishHour");
  const publishMinute = watch("publishMinute");

  const combined = combinePublishDate(publishDate, publishHour, publishMinute);
  const scheduledAt = combined ? new Date(combined) : null;
  const isFuture = scheduledAt ? scheduledAt.getTime() > Date.now() : false;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Publish Date &amp; Time
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <Controller
          name="publishDate"
          control={control}
          render={({ field }) => (
            <CustomDatePicker
              value={field.value}
              onChange={field.onChange}
              wrapperClassName="w-full sm:flex-1"
              className="w-full h-12 flex items-center justify-between gap-2 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            />
          )}
        />
        <div className="flex items-center gap-2">
          <SelectField
            {...register("publishHour")}
            className="w-auto h-12 pl-4 pr-9"
            chevronClassName="right-3"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {pad2(h)}
              </option>
            ))}
          </SelectField>
          <span className="font-bold text-gray-400">:</span>
          <SelectField
            {...register("publishMinute")}
            className="w-auto h-12 pl-4 pr-9"
            chevronClassName="right-3"
          >
            {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
              <option key={m} value={m}>
                {pad2(m)}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 flex items-start gap-1.5">
        {isFuture ? (
          <>
            <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <span>
              Scheduled — will auto-publish on{" "}
              <span className="font-semibold text-gray-700">
                {scheduledAt!.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              .
            </span>
          </>
        ) : (
          <span>Publishes immediately when status is set to Publish.</span>
        )}
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminChurchContentPage() {
  const [activeTab, setActiveTab] = useState<ContentType>("sermon");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  // Manual list only: toggle the theme drag-and-drop grouping board.
  const [manualGroupMode, setManualGroupMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(
    null,
  );
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadedMediaId, setUploadedMediaId] = useState<number | null>(null);
  // The public URL of the uploaded thumbnail. Series Engine stores the
  // thumbnail as a URL (message_thumbnail), not a media attachment ID.
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentPage, setContentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [loadingSpeakers, setLoadingSpeakers] = useState(false);

  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "publish">("draft");
  const [editDate, setEditDate] = useState("");
  const [editHour, setEditHour] = useState("12");
  const [editMinute, setEditMinute] = useState("0");
  const [editSpeaker, setEditSpeaker] = useState("");
  const [editSeriesId, setEditSeriesId] = useState("");
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<
    string | null
  >(null);
  const [editUploadedMediaId, setEditUploadedMediaId] = useState<number | null>(
    null,
  );
  // Public URL of the uploaded thumbnail. Sermons (Series Engine) store the
  // thumbnail as a URL (message_thumbnail), not a WP media attachment ID.
  const [editUploadedMediaUrl, setEditUploadedMediaUrl] = useState<
    string | null
  >(null);
  const [editUploadingThumbnail, setEditUploadingThumbnail] = useState(false);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  // Audio is referenced by URL (S3), not uploaded to WordPress.
  const [editAudioUrl, setEditAudioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editTranscriptType, setEditTranscriptType] =
    useState<TranscriptType>("sunday-message");

  const sermonForm = useForm<SermonFormData>({
    defaultValues: {
      title: "",
      status: "draft",
      speaker: "",
      seriesId: "",
      description: "",
      sermonDate: new Date().toISOString().split("T")[0],
      audioUrl: "",
      thumbnailFile: null,
    },
  });

  const now = new Date();
  const textForm = useForm<TextFormData>({
    defaultValues: {
      title: "",
      content: "",
      status: "draft",
      speaker: "",
      transcriptType: "sunday-message",
      // Default to "now" (minute rounded down to 5) so leaving it untouched
      // publishes immediately; choosing a later moment schedules it.
      publishDate: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
      publishHour: String(now.getHours()),
      publishMinute: String(Math.floor(now.getMinutes() / 5) * 5),
    },
  });

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const currentTab = TABS.find((t) => t.id === activeTab)!;

  // ── Fetch existing content ──────────────────────────────────────────────────
  // This route is read-only and doesn't require auth headers (it's public data
  // fetched from WP). The content is only rendered inside the auth-gated admin
  // layout so it is already protected at the page level.
  const fetchContent = useCallback(
    async (type: ContentType, page: number, search = "") => {
      setLoadingContent(true);
      try {
        const searchParam = search
          ? `&search=${encodeURIComponent(search)}`
          : "";
        // The theme drag-and-drop board groups only the manuals on the current
        // page, so load a much larger page there (≈4+ themes visible) to make
        // dragging between themes actually useful. The normal list stays at 6.
        const perPage = type === "manual" && manualGroupMode ? 48 : 6;
        const res = await fetch(
          `/api/wp/content?type=${type}&page=${page}&per_page=${perPage}${searchParam}`,
        );
        const data = await res.json();
        if (data.items) {
          setContentItems(data.items);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch {
        console.error("Failed to load content");
      } finally {
        setLoadingContent(false);
      }
    },
    [manualGroupMode],
  );

  // ── Fetch speakers for dropdown ─────────────────────────────────────────────
  const fetchSpeakers = useCallback(async () => {
    setLoadingSpeakers(true);
    try {
      const res = await fetch("/api/wp/speakers");
      const data = await res.json();
      if (data.speakers) setSpeakers(data.speakers);
    } catch {
      console.error("Failed to load speakers");
    } finally {
      setLoadingSpeakers(false);
    }
  }, []);

  // ── Fetch series for dropdown ───────────────────────────────────────────────
  const fetchSeries = useCallback(async () => {
    setLoadingSeries(true);
    try {
      const res = await fetch("/api/wp/speakers?type=series");
      const data = await res.json();
      if (data.series) setSeriesList(data.series);
    } catch {
      console.error("Failed to load series");
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  // Debounce the search box; a new query also resets to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setContentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchContent(activeTab, contentPage, debouncedSearch);
  }, [activeTab, contentPage, debouncedSearch, fetchContent]);

  useEffect(() => {
    fetchSpeakers();
    fetchSeries();
  }, [fetchSpeakers, fetchSeries]);

  // ── Handle tab switch ───────────────────────────────────────────────────────
  const handleTabSwitch = (tab: ContentType) => {
    setActiveTab(tab);
    setViewMode("list");
    setContentPage(1);
    setSearchQuery("");
    setDebouncedSearch("");
    sermonForm.reset();
    textForm.reset();
    setThumbnailPreview(null);
    setThumbnailFileName(null);
    setUploadedMediaId(null);
    setUploadedMediaUrl(null);
  };

  // ── Edit item ───────────────────────────────────────────────────────────────
  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content || item.excerpt || "");
    // A scheduled post comes back as "future", which matches neither option in
    // the Status select (it rendered blank). Treat it as "publish" — the future
    // date below is what re-schedules it on save.
    setEditStatus(item.status === "draft" ? "draft" : "publish");
    // Prefer the raw WP timestamp: it is the only source that still has the
    // time. `item.date` is a formatted label ("Jul 28, 2026") whose time the
    // save used to replace with a hardcoded noon, silently moving schedules.
    setEditDate(toDateInputValue(item.dateIso || item.date));
    const time = toTimeInputValues(item.dateIso);
    setEditHour(time ? time.hour : "12");
    setEditMinute(time ? time.minute : "0");
    setEditSpeaker(item.speaker || "");
    const matchedSeries = seriesList.find((s) => s.title === item.series);
    setEditSeriesId(matchedSeries ? String(matchedSeries.id) : "");
    setEditThumbnailPreview(item.thumbnail || null);
    setEditUploadedMediaId(null);
    setEditUploadedMediaUrl(null);
    setEditUploadingThumbnail(false);
    // Prefill with the existing MP3 URL (real audio_url when the message has one).
    setEditAudioUrl(item.audioUrl || "");
    if (item.transcriptType) {
      setEditTranscriptType(item.transcriptType as TranscriptType);
    } else {
      setEditTranscriptType("sunday-message");
    }
  };

  // ── Edit thumbnail upload ───────────────────────────────────────────────────
  const handleEditThumbnailSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setEditThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);

    setEditUploadingThumbnail(true);
    try {
      // ── Auth header added ─────────────────────────────────────────────────
      const authHeader = await getAuthorizationHeader();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/wp/upload-media", {
        method: "POST",
        headers: { Authorization: authHeader },
        body: formData,
      });
      const data = await res.json();
      // The /api/wp/upload-media route returns the new attachment as `id`
      // (not `mediaId`). Reading the wrong field left editUploadedMediaId null,
      // so the thumbnail was never written back on edit.
      if (data.id) {
        setEditUploadedMediaId(data.id);
        // Series Engine sermons need the thumbnail URL, not the media ID.
        setEditUploadedMediaUrl(data.url || null);
        toast.success("Thumbnail uploaded!");
      } else {
        toast.error("Thumbnail upload failed");
      }
    } catch {
      toast.error("Thumbnail upload failed");
    } finally {
      setEditUploadingThumbnail(false);
    }
  };


  // ── Save edit ───────────────────────────────────────────────────────────────
  // FIX: getAuthorizationHeader() called and Authorization header sent on every
  // mutating fetch (audio upload, PUT to /api/wp/update).
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      // Get Firebase ID token once and reuse for all requests in this handler
      const authHeader = await getAuthorizationHeader();

      // Build content with the Minister line reflecting the speaker dropdown:
      // strip any existing leading Minister/Speaker line (start-anchored & safe —
      // never touches the body), then re-prepend from the selected speaker.
      let contentToSave = stripLeadingSpeakerLine(editContent);

      if (editSpeaker) {
        if (activeTab === "transcript") {
          contentToSave = `<p><strong>Minister:</strong> ${editSpeaker}</p>\n${contentToSave}`;
        } else {
          contentToSave = `Minister: ${editSpeaker}\n${contentToSave}`;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        id: editingItem.id,
        type: activeTab,
        title: editTitle,
        content: contentToSave,
        status: editStatus,
        speaker: editSpeaker,
      };
      // Send the naive datetime the admin actually chose (no timezone suffix)
      // so WordPress reads it in the site's timezone and keeps both the day and
      // the hour. This previously hardcoded noon, which reset the schedule of
      // any post edited after it was scheduled.
      const editPublishAt = combinePublishDate(editDate, editHour, editMinute);
      if (editPublishAt) {
        payload.date = editPublishAt;
        // A future moment means "schedule it": WordPress stores the post as
        // "future" and publishes then. Leaving status "publish" with a future
        // date would otherwise depend on WP inferring the intent.
        if (
          editStatus === "publish" &&
          new Date(editPublishAt).getTime() > Date.now()
        ) {
          payload.status = "future";
        }
      }
      if (editUploadedMediaId) payload.featuredMediaId = editUploadedMediaId;
      if (activeTab === "sermon") {
        // Sermons are Series Engine messages: the MP3 and thumbnail are URLs,
        // and the series is reassigned via seriesId (mapped to series_id). The
        // thumbnail must be sent as a URL (message_thumbnail) — the media ID in
        // featuredMediaId is ignored by the Series Engine update.
        if (editAudioUrl) payload.audioUrl = editAudioUrl;
        if (editUploadedMediaUrl) payload.thumbnailUrl = editUploadedMediaUrl;
        if (editSeriesId) payload.seriesId = Number(editSeriesId);
      } else if (activeTab === "transcript") {
        // Write the transcript type back as its WP category. Without this, the
        // "Transcript Type" select in the edit modal was a no-op — the value
        // never reached the update payload (only sermons sent categories).
        payload.categories = [TRANSCRIPT_TYPE_TO_CATEGORY[editTranscriptType]];
      }

      const res = await fetch("/api/wp/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader, // ← auth header added
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Post updated successfully!", {
          description: `Post #${data.postId} saved.`,
        });
        setEditingItem(null);
        setEditAudioUrl("");
        // Refresh the admin list so the updated post is immediately visible
        fetchContent(activeTab, contentPage, debouncedSearch);
      } else {
        toast.error("Failed to update", {
          description: data.error || "Unknown error",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not reach the server.";
      toast.error("Save failed", { description: message });
    } finally {
      setSaving(false);
    }
  };

  // ── Thumbnail selection & upload (create form) ──────────────────────────────
  const handleThumbnailSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingThumbnail(true);
    try {
      // ── Auth header added ─────────────────────────────────────────────────
      const authHeader = await getAuthorizationHeader();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/wp/upload-media", {
        method: "POST",
        headers: { Authorization: authHeader },
        body: formData,
      });
      const data = await res.json();
      if (data.id) {
        setUploadedMediaId(data.id);
        // Series Engine references the thumbnail by URL, so keep the public URL.
        setUploadedMediaUrl(data.url || null);
        toast.success("Thumbnail uploaded", {
          description: "Image saved to WordPress media library.",
        });
      } else {
        toast.error("Thumbnail upload failed", {
          description: data.error || "Unknown error",
        });
      }
    } catch {
      toast.error("Upload error", {
        description: "Could not upload thumbnail to WordPress.",
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // ── Sermon submit ───────────────────────────────────────────────────────────
  // FIX: Authorization header added to the POST request.
  const onSermonSubmit = async (data: SermonFormData) => {
    setPublishing(true);
    try {
      // ── Auth header added ─────────────────────────────────────────────────
      const authHeader = await getAuthorizationHeader();

      // Audio sermons are Series Engine messages, not WordPress posts. The MP3
      // is referenced by URL (S3), and the thumbnail is sent as a URL too.
      const res = await fetch("/api/wp/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          type: "sermon",
          title: data.title,
          audioUrl: data.audioUrl,
          speaker: data.speaker || undefined,
          description: data.description || undefined,
          seriesId: data.seriesId || undefined,
          date: data.sermonDate || undefined,
          thumbnailUrl: uploadedMediaUrl || undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Sermon published successfully!", {
          description: `Message ID: ${result.postId}`,
          action: result.postUrl
            ? {
                label: "View Post",
                onClick: () => window.open(result.postUrl, "_blank"),
              }
            : undefined,
        });
        sermonForm.reset();
        setThumbnailPreview(null);
        setThumbnailFileName(null);
        setUploadedMediaId(null);
        setUploadedMediaUrl(null);
        setViewMode("list");
        fetchContent(activeTab, 1, debouncedSearch);
      } else {
        toast.error("Failed to publish", {
          description: result.error || "Unknown error",
        });
      }
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
    } finally {
      setPublishing(false);
    }
  };

  // ── Text content submit (transcripts & manuals) ─────────────────────────────
  // FIX: Authorization header added to the POST request.
  const onTextSubmit = async (data: TextFormData) => {
    setPublishing(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {
      type: activeTab,
      title: data.title,
      content: data.content,
      status: data.status,
    };

    if (activeTab === "transcript") {
      if (data.speaker) payload.speaker = data.speaker;
      payload.transcriptType = data.transcriptType || "sunday-message";
    }

    // Attach the chosen publish date/time. A future date means the user wants
    // the post scheduled, so force status "publish" — WordPress then stores it
    // as "future" and auto-publishes at that time. (Otherwise a future date
    // left on the default "Draft" toggle just saves a draft, which is
    // surprising for something explicitly given a later publish date.)
    const publishAt = combinePublishDate(
      data.publishDate,
      data.publishHour,
      data.publishMinute,
    );
    const isScheduled =
      !!publishAt && new Date(publishAt).getTime() > Date.now();
    if (publishAt) payload.date = publishAt;
    if (isScheduled) payload.status = "publish";

    try {
      // ── Auth header added ─────────────────────────────────────────────────
      const authHeader = await getAuthorizationHeader();

      const res = await fetch("/api/wp/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        const scheduled = result.status === "future";
        toast.success(
          scheduled ? "Scheduled successfully!" : "Published successfully!",
          {
            description:
              scheduled && publishAt
                ? `Auto-publishes on ${new Date(publishAt).toLocaleString(
                    undefined,
                    { dateStyle: "medium", timeStyle: "short" },
                  )}`
                : `Post ID: ${result.postId}`,
            action: result.postUrl
              ? {
                  label: "View Post",
                  onClick: () => window.open(result.postUrl, "_blank"),
                }
              : undefined,
          },
        );
        textForm.reset();
        setViewMode("list");
        fetchContent(activeTab, 1, debouncedSearch);
      } else {
        toast.error("Failed to publish", {
          description: result.error || "Unknown error",
        });
      }
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Church Content</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage sermons, transcripts, and manuals
          </p>
        </div>
        {viewMode === "list" ? (
          <Button
            variant="brand"
            size="none"
            onClick={() => setViewMode("create")}
            className="w-full sm:w-auto px-5 py-2.5 font-semibold"
          >
            <Plus className="w-4 h-4" />
            New {currentTab.label.slice(0, -1)}
          </Button>
        ) : (
          <Button
            variant="soft"
            size="none"
            onClick={() => setViewMode("list")}
            className="w-full sm:w-auto px-5 py-2.5"
          >
            <Eye className="w-4 h-4" />
            View Published
          </Button>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "bg-white text-gray-900 shadow-lg shadow-gray-200/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r ${tab.color}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          /* ══════════════ LIST VIEW ══════════════ */
          <motion.div
            key={`list-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${currentTab.color}`} />
              <div className="p-5 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTab.color} flex items-center justify-center shadow-lg`}
                  >
                    <currentTab.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                      Published {currentTab.label}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {currentTab.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === "manual" && (
                    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 border border-gray-200">
                      <button
                        onClick={() => {
                          setManualGroupMode(false);
                          setContentPage(1);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          !manualGroupMode
                            ? "bg-white text-amber-600 shadow-sm"
                            : "text-gray-500 hover:text-amber-600"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        List
                      </button>
                      <button
                        onClick={() => {
                          setManualGroupMode(true);
                          setContentPage(1);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          manualGroupMode
                            ? "bg-white text-amber-600 shadow-sm"
                            : "text-gray-500 hover:text-amber-600"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Group by theme
                      </button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      fetchContent(activeTab, contentPage, debouncedSearch)
                    }
                    className="rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Refresh"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingContent ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 border-b border-gray-50">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Search ${currentTab.label.toLowerCase()}…`}
                  className="h-11 pl-11 pr-4 bg-gray-50 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div className="p-4 sm:p-6">
                {loadingContent ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm">Loading content…</p>
                  </div>
                ) : contentItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <currentTab.icon className="w-12 h-12 mb-3 opacity-30" />
                    {debouncedSearch ? (
                      <>
                        <p className="text-sm font-medium">
                          No {currentTab.label.toLowerCase()} match “
                          {debouncedSearch}”
                        </p>
                        <button
                          onClick={() => setSearchQuery("")}
                          className="text-xs mt-1 text-primary font-medium hover:underline cursor-pointer"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          No {currentTab.label.toLowerCase()} found
                        </p>
                        <p className="text-xs mt-1">
                          Create your first one by clicking the button above
                        </p>
                      </>
                    )}
                  </div>
                ) : activeTab === "manual" && manualGroupMode ? (
                  <ManualThemeBoard
                    items={contentItems.map((it) => ({
                      id: it.id,
                      title: it.title,
                      theme: it.theme,
                      lesson: it.lesson,
                      date: it.date,
                    }))}
                    getAuthHeader={getAuthorizationHeader}
                    onEditItem={(id) => {
                      const item = contentItems.find((x) => x.id === id);
                      if (item) handleEditItem(item);
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {contentItems.map((item) => (
                      <ContentListItem
                        key={item.id}
                        item={item}
                        type={activeTab}
                        onEdit={handleEditItem}
                      />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setContentPage((p) => Math.max(1, p - 1))}
                      disabled={contentPage <= 1}
                      className="px-3 sm:px-4 py-2 rounded-lg text-[13px] sm:text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="text-xs sm:text-sm text-gray-500 px-1 sm:px-3">
                      {contentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setContentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={contentPage >= totalPages}
                      className="px-3 sm:px-4 py-2 rounded-lg text-[13px] sm:text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Content synced from WordPress at ikdadmin.nlwc.church
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ══════════════ CREATE VIEW ══════════════ */
          <motion.div
            key={`create-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${currentTab.color}`} />
              <div className="p-6 sm:p-8 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTab.color} flex items-center justify-center shadow-lg`}
                  >
                    <currentTab.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      New {currentTab.label.slice(0, -1)}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {currentTab.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* ─────── SERMON FORM ─────── */}
              {activeTab === "sermon" && (
                <form
                  onSubmit={sermonForm.handleSubmit(onSermonSubmit)}
                  className="p-6 sm:p-8 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sermon Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...sermonForm.register("title", {
                        required: "Title is required",
                      })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Enter sermon title…"
                    />
                    {sermonForm.formState.errors.title && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {sermonForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Speaker / Minister
                    </label>
                    <SelectField
                      {...sermonForm.register("speaker")}
                      className="h-12 px-4 pr-10"
                    >
                      <option value="">Select a minister…</option>
                      {loadingSpeakers ? (
                        <option disabled>Loading ministers…</option>
                      ) : (
                        speakers.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.messageCount} messages)
                          </option>
                        ))
                      )}
                    </SelectField>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Series / Category
                    </label>
                    <SelectField
                      {...sermonForm.register("seriesId")}
                      className="h-12 px-4 pr-10"
                    >
                      <option value="">Select a series…</option>
                      {loadingSeries ? (
                        <option disabled>Loading series…</option>
                      ) : (
                        seriesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.messageCount} messages)
                          </option>
                        ))
                      )}
                    </SelectField>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...sermonForm.register("description")}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y"
                      placeholder="Brief description of the sermon (optional)…"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sermon Date
                    </label>
                    <Controller
                      name="sermonDate"
                      control={sermonForm.control}
                      render={({ field }) => (
                        <CustomDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          className="w-full h-12 flex items-center justify-between gap-2 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                        />
                      )}
                    />
                  </div>

                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message Thumbnail
                    </label>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                    />
                    {thumbnailPreview ? (
                      <div className="relative rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 flex items-end">
                          <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {uploadingThumbnail ? (
                                  <>
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    <span className="text-xs text-white font-medium">
                                      Uploading…
                                    </span>
                                  </>
                                ) : uploadedMediaId ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-white font-medium">
                                      {thumbnailFileName}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs text-white font-medium">
                                      Upload failed
                                    </span>
                                  </>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setThumbnailPreview(null);
                                  setThumbnailFileName(null);
                                  setUploadedMediaId(null);
                                  setUploadedMediaUrl(null);
                                  if (thumbnailInputRef.current)
                                    thumbnailInputRef.current.value = "";
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/20 transition-all">
                          <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
                            Click to upload thumbnail image
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG, WEBP, or AVIF
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Audio MP3 URL — audio is hosted on S3, not WordPress */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Audio MP3 URL <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FileAudio className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        type="url"
                        inputMode="url"
                        {...sermonForm.register("audioUrl", {
                          required: "Audio MP3 URL is required",
                          pattern: {
                            value: /^https?:\/\/.+/i,
                            message: "Enter a valid URL starting with http(s)://",
                          },
                        })}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        placeholder="https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/…/message.mp3"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      Paste the link to the hosted MP3 (e.g. AWS S3). The audio is
                      not uploaded to WordPress.
                    </p>
                    {sermonForm.formState.errors.audioUrl && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {sermonForm.formState.errors.audioUrl.message}
                      </p>
                    )}
                  </div>

                  {/* Status & Submit */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <span className="text-sm font-medium text-gray-600">
                        Status:
                      </span>
                      <div className="relative">
                        <select
                          {...sermonForm.register("status")}
                          className="h-9 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
                        >
                          <option value="draft">📝 Draft</option>
                          <option value="publish">🚀 Publish</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="brand"
                      size="none"
                      disabled={publishing}
                      className="flex-1 sm:flex-none sm:min-w-[200px] py-4"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Publish Sermon
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* ─────── TRANSCRIPT FORM ─────── */}
              {activeTab === "transcript" && (
                <form
                  onSubmit={textForm.handleSubmit(onTextSubmit)}
                  className="p-6 sm:p-8 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...textForm.register("title", {
                        required: "Title is required",
                      })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Enter transcript title…"
                    />
                    {textForm.formState.errors.title && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {textForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transcript Type <span className="text-red-400">*</span>
                    </label>
                    <SelectField
                      {...textForm.register("transcriptType")}
                      className="h-12 px-4 pr-10"
                    >
                      <option value="sunday-message">
                        Sunday Message Transcript
                      </option>
                      <option value="sunday-school">
                        Sunday School Transcript
                      </option>
                      <option value="bible-study">Bible Study Transcript</option>
                      <option value="other-meetings">
                        Other Meetings Transcript
                      </option>
                      <option value="season-of-the-spirit">
                        Season of the Spirit
                      </option>
                    </SelectField>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Speaker / Minister
                    </label>
                    <SelectField
                      {...textForm.register("speaker")}
                      className="h-12 px-4 pr-10"
                    >
                      <option value="">Select a minister…</option>
                      {loadingSpeakers ? (
                        <option disabled>Loading ministers…</option>
                      ) : (
                        speakers.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.messageCount} messages)
                          </option>
                        ))
                      )}
                    </SelectField>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content <span className="text-red-400">*</span>
                    </label>
                    <Controller
                      name="content"
                      control={textForm.control}
                      rules={{ required: "Content is required" }}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Write the transcript content here…"
                        />
                      )}
                    />
                    {textForm.formState.errors.content && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {textForm.formState.errors.content.message}
                      </p>
                    )}
                  </div>

                  <PublishScheduleField form={textForm} />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <span className="text-sm font-medium text-gray-600">
                        Status:
                      </span>
                      <div className="relative">
                        <select
                          {...textForm.register("status")}
                          className="h-9 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
                        >
                          <option value="draft">📝 Draft</option>
                          <option value="publish">🚀 Publish</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="brand"
                      size="none"
                      disabled={publishing}
                      className="flex-1 sm:flex-none sm:min-w-[200px] py-4"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Publish Transcript
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* ─────── MANUAL FORM ─────── */}
              {activeTab === "manual" && (
                <form
                  onSubmit={textForm.handleSubmit(onTextSubmit)}
                  className="p-6 sm:p-8 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...textForm.register("title", {
                        required: "Title is required",
                      })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Enter manual title…"
                    />
                    {textForm.formState.errors.title && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {textForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content <span className="text-red-400">*</span>
                    </label>
                    <Controller
                      name="content"
                      control={textForm.control}
                      rules={{ required: "Content is required" }}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Write the manual content here…"
                        />
                      )}
                    />
                    {textForm.formState.errors.content && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {textForm.formState.errors.content.message}
                      </p>
                    )}
                  </div>

                  <PublishScheduleField form={textForm} />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <span className="text-sm font-medium text-gray-600">
                        Status:
                      </span>
                      <div className="relative">
                        <select
                          {...textForm.register("status")}
                          className="h-9 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
                        >
                          <option value="draft">📝 Draft</option>
                          <option value="publish">🚀 Publish</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="brand"
                      size="none"
                      disabled={publishing}
                      className="flex-1 sm:flex-none sm:min-w-[200px] py-4"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Publish Manual
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              <div className="px-6 sm:px-8 py-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Content will be published to the WordPress database at
                  ikdadmin.nlwc.church
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ EDIT MODAL ══════════════ */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setEditingItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Edit{" "}
                      {activeTab === "sermon"
                        ? "Sermon"
                        : activeTab === "transcript"
                          ? "Transcript"
                          : "Manual"}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Post #{editingItem.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {(activeTab === "sermon" || activeTab === "transcript") && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Speaker / Minister
                    </label>
                    <SelectField
                      value={editSpeaker}
                      onChange={(e) => setEditSpeaker(e.target.value)}
                      className="h-12 px-4 pr-10"
                    >
                      <option value="">Select a minister…</option>
                      {loadingSpeakers ? (
                        <option disabled>Loading ministers…</option>
                      ) : (
                        speakers.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.messageCount} messages)
                          </option>
                        ))
                      )}
                    </SelectField>
                  </div>
                )}

                {activeTab === "transcript" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transcript Type
                    </label>
                    <SelectField
                      value={editTranscriptType}
                      onChange={(e) =>
                        setEditTranscriptType(e.target.value as TranscriptType)
                      }
                      className="h-12 px-4 pr-10"
                    >
                      <option value="sunday-message">
                        Sunday Message Transcript
                      </option>
                      <option value="sunday-school">
                        Sunday School Transcript
                      </option>
                      <option value="bible-study">Bible Study Transcript</option>
                      <option value="other-meetings">
                        Other Meetings Transcript
                      </option>
                      <option value="season-of-the-spirit">
                        Season of the Spirit
                      </option>
                    </SelectField>
                  </div>
                )}

                {activeTab === "sermon" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Series / Category
                    </label>
                    <SelectField
                      value={editSeriesId}
                      onChange={(e) => setEditSeriesId(e.target.value)}
                      className="h-12 px-4 pr-10"
                    >
                      <option value="">Select a series…</option>
                      {loadingSeries ? (
                        <option disabled>Loading series…</option>
                      ) : (
                        seriesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.messageCount} messages)
                          </option>
                        ))
                      )}
                    </SelectField>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {activeTab === "sermon" ? "Description" : "Content"}
                  </label>
                  {activeTab === "sermon" ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y"
                      placeholder="Description / notes…"
                    />
                  ) : (
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Edit content…"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {activeTab === "sermon" ? "Sermon Date" : "Date & Time"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <CustomDatePicker
                      value={editDate}
                      onChange={setEditDate}
                      wrapperClassName="w-full sm:flex-1"
                      className="w-full h-12 flex items-center justify-between gap-2 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                    />
                    {activeTab !== "sermon" && (
                      <div className="flex items-center gap-2">
                        <SelectField
                          value={editHour}
                          onChange={(e) => setEditHour(e.target.value)}
                          className="w-auto h-12 pl-4 pr-9"
                          chevronClassName="right-3"
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>
                              {pad2(h)}
                            </option>
                          ))}
                        </SelectField>
                        <span className="font-bold text-gray-400">:</span>
                        <SelectField
                          value={editMinute}
                          onChange={(e) => setEditMinute(e.target.value)}
                          className="w-auto h-12 pl-4 pr-9"
                          chevronClassName="right-3"
                        >
                          {Array.from({ length: 12 }, (_, i) => i * 5).map(
                            (m) => (
                              <option key={m} value={m}>
                                {pad2(m)}
                              </option>
                            ),
                          )}
                        </SelectField>
                      </div>
                    )}
                  </div>
                  {activeTab !== "sermon" && (
                    <p className="mt-2 text-xs text-gray-500">
                      24-hour clock — 00:15 is 12:15 AM, 12:15 is 12:15 PM.
                    </p>
                  )}
                </div>

                {activeTab === "sermon" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message Thumbnail
                    </label>
                    <input
                      ref={editThumbnailInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
                      onChange={handleEditThumbnailSelect}
                      className="hidden"
                    />
                    {editThumbnailPreview ? (
                      <div className="relative rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={editThumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute inset-0 flex items-end">
                          <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {editUploadingThumbnail ? (
                                  <>
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    <span className="text-xs text-white font-medium">
                                      Uploading…
                                    </span>
                                  </>
                                ) : editUploadedMediaId ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-white font-medium">
                                      New thumbnail uploaded
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 text-white/70" />
                                    <span className="text-xs text-white font-medium">
                                      Current thumbnail
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    editThumbnailInputRef.current?.click()
                                  }
                                  className="px-2.5 h-7 flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  <ImagePlus className="w-3 h-3" />
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditThumbnailPreview(null);
                                    setEditUploadedMediaId(null);
                                    if (editThumbnailInputRef.current)
                                      editThumbnailInputRef.current.value = "";
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editThumbnailInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/20 transition-all">
                          <ImagePlus className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs font-medium text-gray-500 group-hover:text-primary transition-colors">
                          Upload new thumbnail
                        </p>
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "sermon" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Audio MP3 URL
                    </label>
                    <div className="relative">
                      <FileAudio className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        type="url"
                        inputMode="url"
                        value={editAudioUrl}
                        onChange={(e) => setEditAudioUrl(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        placeholder="https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/…/message.mp3"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      Link to the hosted MP3 (e.g. AWS S3). Leave unchanged to keep
                      the current audio.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="relative w-48">
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as "draft" | "publish")
                      }
                      className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="publish">🚀 Publish</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <Button
                  variant="ghost"
                  size="none"
                  onClick={() => setEditingItem(null)}
                  className="px-5 h-10 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  size="none"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-6 h-10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
