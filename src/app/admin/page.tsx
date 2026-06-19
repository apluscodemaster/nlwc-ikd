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
  Upload,
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
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Heading2,
  Link as LinkIcon,
  Quote,
} from "lucide-react";
import { showPrompt } from "@/components/shared/CustomDialog";
import { CustomDatePicker } from "@/components/shared/CustomDatePicker";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SelectField } from "@/components/shared/SelectField";
import { Button } from "@/components/ui/button";
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

interface SermonFormData {
  title: string;
  status: "draft" | "publish";
  speaker: string;
  seriesId: string;
  description: string;
  sermonDate: string;
  audioFile: FileList | null;
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

  const formatBlock = (tag: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    editorRef.current.focus();

    const range = sel.getRangeAt(0);
    let block = range.startContainer as Node;
    while (
      block &&
      block !== editorRef.current &&
      block.parentNode !== editorRef.current
    ) {
      block = block.parentNode!;
    }

    if (block && block !== editorRef.current && block instanceof HTMLElement) {
      if (block.tagName.toLowerCase() === tag.toLowerCase()) {
        const p = document.createElement("p");
        p.innerHTML = block.innerHTML;
        block.replaceWith(p);
      } else {
        const newEl = document.createElement(tag);
        newEl.innerHTML = block.innerHTML;
        block.replaceWith(newEl);
      }
    } else {
      const newEl = document.createElement(tag);
      try {
        range.surroundContents(newEl);
      } catch {
        const content = range.extractContents();
        newEl.appendChild(content);
        range.insertNode(newEl);
      }
    }
    handleInput();
  };

  const insertList = (ordered: boolean) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    editorRef.current.focus();

    const range = sel.getRangeAt(0);

    let block = range.startContainer as Node;
    while (
      block &&
      block !== editorRef.current &&
      block.parentNode !== editorRef.current
    ) {
      block = block.parentNode!;
    }

    const listTag = ordered ? "OL" : "UL";

    if (block instanceof HTMLElement) {
      if (block.tagName === "UL" || block.tagName === "OL") {
        const items = block.querySelectorAll("li");
        const frag = document.createDocumentFragment();
        items.forEach((li) => {
          const p = document.createElement("p");
          p.innerHTML = li.innerHTML;
          frag.appendChild(p);
        });
        block.replaceWith(frag);
        handleInput();
        return;
      }
    }

    const list = document.createElement(listTag);
    const li = document.createElement("li");

    if (block && block !== editorRef.current && block instanceof HTMLElement) {
      li.innerHTML = block.innerHTML || "List item";
      list.appendChild(li);
      block.replaceWith(list);
    } else {
      const selectedText = range.toString() || "List item";
      li.textContent = selectedText;
      list.appendChild(li);
      range.deleteContents();
      range.insertNode(list);
    }

    const newRange = document.createRange();
    newRange.selectNodeContents(li);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);

    handleInput();
  };

  const setAlignment = (align: "left" | "center" | "right" | "justify") => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    editorRef.current.focus();

    const range = sel.getRangeAt(0);
    let block = range.startContainer as Node;
    while (
      block &&
      block !== editorRef.current &&
      block.parentNode !== editorRef.current
    ) {
      block = block.parentNode!;
    }

    if (block && block !== editorRef.current && block instanceof HTMLElement) {
      block.style.textAlign = align === "left" ? "" : align;
    }
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

    editorRef.current?.focus();
    restoreSelection(savedRange);

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const selectedText = range.toString();

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = selectedText || url;
    anchor.style.color = "#2563eb";
    anchor.style.textDecoration = "underline";

    range.deleteContents();
    range.insertNode(anchor);

    const newRange = document.createRange();
    newRange.setStartAfter(anchor);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

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
    { icon: Heading2, action: () => formatBlock("h2"), title: "Heading" },
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const li =
        (sel.anchorNode as HTMLElement)?.closest?.("li") ||
        sel.anchorNode?.parentElement?.closest?.("li");

      if (li) {
        e.preventDefault();
        if (!li.textContent?.trim()) {
          const list = li.closest("ul, ol");
          if (list) {
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            list.after(p);
            li.remove();
            if (list.children.length === 0) list.remove();
            const range = document.createRange();
            range.selectNodeContents(p);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            handleInput();
          }
          return;
        }

        const newLi = document.createElement("li");
        newLi.innerHTML = "<br>";
        li.after(newLi);
        const range = document.createRange();
        range.selectNodeContents(newLi);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        handleInput();
      }
    }

    if (e.key === "Tab") {
      const sel = window.getSelection();
      if (!sel) return;
      const li =
        (sel.anchorNode as HTMLElement)?.closest?.("li") ||
        sel.anchorNode?.parentElement?.closest?.("li");
      if (li) {
        e.preventDefault();
        const current = parseInt(li.style.marginLeft || "0");
        li.style.marginLeft = `${current + (e.shiftKey ? -20 : 20)}px`;
        handleInput();
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/80">
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
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="min-h-[280px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400
          [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
          [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
          [&_a]:text-blue-600 [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2"
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
  const [publishing, setPublishing] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(
    null,
  );
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadedMediaId, setUploadedMediaId] = useState<number | null>(null);

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
  const [editSpeaker, setEditSpeaker] = useState("");
  const [editSeriesId, setEditSeriesId] = useState("");
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<
    string | null
  >(null);
  const [editUploadedMediaId, setEditUploadedMediaId] = useState<number | null>(
    null,
  );
  const [editUploadingThumbnail, setEditUploadingThumbnail] = useState(false);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [editAudioFileName, setEditAudioFileName] = useState<string | null>(
    null,
  );
  const [editAudioFile, setEditAudioFile] = useState<FileList | null>(null);
  const editAudioInputRef = useRef<HTMLInputElement>(null);
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
      audioFile: null,
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

  const audioInputRef = useRef<HTMLInputElement>(null);
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
        const res = await fetch(
          `/api/wp/content?type=${type}&page=${page}&per_page=6${searchParam}`,
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
    [],
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
    setAudioFileName(null);
    setThumbnailPreview(null);
    setThumbnailFileName(null);
    setUploadedMediaId(null);
  };

  // ── Audio file selection ────────────────────────────────────────────────────
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      sermonForm.setValue("audioFile", e.target.files);
    }
  };

  // ── Edit item ───────────────────────────────────────────────────────────────
  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content || item.excerpt || "");
    setEditStatus(item.status as "draft" | "publish");
    setEditDate(
      item.date ? new Date(item.date).toISOString().split("T")[0] : "",
    );
    setEditSpeaker(item.speaker || "");
    const matchedSeries = seriesList.find((s) => s.title === item.series);
    setEditSeriesId(matchedSeries ? String(matchedSeries.id) : "");
    setEditThumbnailPreview(item.thumbnail || null);
    setEditUploadedMediaId(null);
    setEditUploadingThumbnail(false);
    setEditAudioFileName(null);
    setEditAudioFile(null);
    if (editAudioInputRef.current) editAudioInputRef.current.value = "";
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

  // ── Edit audio file selection ───────────────────────────────────────────────
  const handleEditAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditAudioFileName(file.name);
      setEditAudioFile(e.target.files);
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

      // Upload new audio if selected
      let uploadedAudioMediaId: number | null = null;
      if (activeTab === "sermon" && editAudioFile && editAudioFile[0]) {
        try {
          const formData = new FormData();
          formData.append("file", editAudioFile[0]);
          const audioRes = await fetch("/api/wp/upload-media", {
            method: "POST",
            headers: { Authorization: authHeader }, // ← auth header added
            body: formData,
          });
          const audioData = await audioRes.json();
          // upload-media returns `id`, not `mediaId`.
          if (audioData.id) {
            uploadedAudioMediaId = audioData.id;
            toast.success("Audio file uploaded!");
          } else {
            toast.warning(
              "Audio upload failed, but continuing with other changes...",
            );
          }
        } catch {
          toast.warning(
            "Audio upload failed, but continuing with other changes...",
          );
        }
      }

      // Build content with speaker prepended if provided
      let contentToSave = editContent;

      contentToSave = contentToSave.replace(
        /<p><strong>Minister:<\/strong>.*?<\/p>\n?/gi,
        "",
      );
      contentToSave = contentToSave.replace(
        /(?:Minister|Speaker):\s*[^\n]*\n?/gi,
        "",
      );

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
      if (editDate) payload.date = new Date(editDate).toISOString();
      if (editUploadedMediaId) payload.featuredMediaId = editUploadedMediaId;
      if (activeTab === "sermon" && editSeriesId) {
        payload.categories = [Number(editSeriesId)];
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
        setEditAudioFileName(null);
        setEditAudioFile(null);
        if (editAudioInputRef.current) editAudioInputRef.current.value = "";
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
      const contentParts = [];
      if (data.speaker)
        contentParts.push(`<p><strong>Minister:</strong> ${data.speaker}</p>`);
      if (data.description) contentParts.push(`<p>${data.description}</p>`);
      if (!contentParts.length)
        contentParts.push(`<p>Audio sermon uploaded via admin dashboard.</p>`);

      // ── Auth header added ─────────────────────────────────────────────────
      const authHeader = await getAuthorizationHeader();

      const res = await fetch("/api/wp/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          type: "sermon",
          title: data.title,
          content: contentParts.join("\n"),
          status: data.status,
          speaker: data.speaker,
          featuredMediaId: uploadedMediaId || undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Sermon published successfully!", {
          description: `Post ID: ${result.postId}`,
          action: result.postUrl
            ? {
                label: "View Post",
                onClick: () => window.open(result.postUrl, "_blank"),
              }
            : undefined,
        });
        sermonForm.reset();
        setAudioFileName(null);
        setThumbnailPreview(null);
        setThumbnailFileName(null);
        setUploadedMediaId(null);
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

                  {/* Audio */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Audio File <span className="text-red-400">*</span>
                    </label>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      onChange={handleAudioSelect}
                      className="hidden"
                    />
                    {audioFileName ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileAudio className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {audioFileName}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Audio file selected
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAudioFileName(null);
                            sermonForm.setValue("audioFile", null);
                            if (audioInputRef.current)
                              audioInputRef.current.value = "";
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/20 transition-all">
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
                            Click to upload audio file
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            MP3, WAV, OGG, M4A, or AAC
                          </p>
                        </div>
                      </button>
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

                {activeTab === "sermon" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sermon Date
                    </label>
                    <CustomDatePicker
                      value={editDate}
                      onChange={setEditDate}
                      className="w-full h-12 flex items-center justify-between gap-2 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                    />
                  </div>
                )}

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
                      Audio File (Update)
                    </label>
                    <input
                      ref={editAudioInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      onChange={handleEditAudioSelect}
                      className="hidden"
                    />
                    {editAudioFileName ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileAudio className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {editAudioFileName}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            New audio file selected
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditAudioFileName(null);
                            setEditAudioFile(null);
                            if (editAudioInputRef.current)
                              editAudioInputRef.current.value = "";
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editAudioInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/20 transition-all">
                          <Upload className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs font-medium text-gray-500 group-hover:text-primary transition-colors">
                          Upload new audio file (optional)
                        </p>
                      </button>
                    )}
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
