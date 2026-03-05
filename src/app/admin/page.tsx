"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
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
  Heading2,
  Link as LinkIcon,
  Quote,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ContentType = "sermon" | "transcript" | "manual";
type ViewMode = "create" | "list";

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

interface TextFormData {
  title: string;
  content: string;
  status: "draft" | "publish";
  speaker: string;
  transcriptType: "sunday-message" | "sunday-school";
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
    description: "Audio messages & sermons",
    color: "from-primary to-amber-500",
  },
  {
    id: "transcript",
    label: "Transcripts",
    icon: FileText,
    description: "Message & Sunday School transcripts",
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

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const toolbarButtons = [
    { icon: Bold, command: "bold", title: "Bold" },
    { icon: Italic, command: "italic", title: "Italic" },
    { icon: UnderlineIcon, command: "underline", title: "Underline" },
    { icon: null, command: "divider" },
    { icon: Heading2, command: "formatBlock", value: "h2", title: "Heading" },
    {
      icon: Quote,
      command: "formatBlock",
      value: "blockquote",
      title: "Quote",
    },
    { icon: null, command: "divider" },
    { icon: List, command: "insertUnorderedList", title: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", title: "Numbered List" },
    { icon: null, command: "divider" },
    { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", title: "Center" },
    { icon: null, command: "divider" },
    { icon: LinkIcon, command: "link", title: "Insert Link" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/80">
        {toolbarButtons.map((btn, i) => {
          if (btn.command === "divider") {
            return (
              <div key={`div-${i}`} className="w-px h-5 bg-gray-200 mx-1" />
            );
          }
          const Icon = btn.icon!;
          return (
            <button
              key={btn.command + (btn.value || "") + i}
              type="button"
              title={btn.title}
              onClick={() => {
                if (btn.command === "link") {
                  insertLink();
                } else if (btn.value) {
                  execCommand(btn.command, btn.value);
                } else {
                  execCommand(btn.command);
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors cursor-pointer"
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[280px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400"
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
      {/* Thumbnail / Icon */}
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

      {/* Content */}
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

      {/* Actions */}
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
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            item.status === "publish"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {item.status === "publish" ? "Live" : "Draft"}
        </span>
      </div>
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

  // Existing content state
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentPage, setContentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Speakers state
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [loadingSpeakers, setLoadingSpeakers] = useState(false);

  // Series state
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  // Edit state
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
  const [saving, setSaving] = useState(false);

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

  const textForm = useForm<TextFormData>({
    defaultValues: {
      title: "",
      content: "",
      status: "draft",
      speaker: "",
      transcriptType: "sunday-message",
    },
  });

  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const currentTab = TABS.find((t) => t.id === activeTab)!;

  // ── Fetch existing content ──
  const fetchContent = useCallback(async (type: ContentType, page: number) => {
    setLoadingContent(true);
    try {
      const res = await fetch(
        `/api/wp/content?type=${type}&page=${page}&per_page=6`,
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
  }, []);

  // ── Fetch speakers for dropdown ──
  const fetchSpeakers = useCallback(async () => {
    setLoadingSpeakers(true);
    try {
      const res = await fetch("/api/wp/speakers");
      const data = await res.json();
      if (data.speakers) {
        setSpeakers(data.speakers);
      }
    } catch {
      console.error("Failed to load speakers");
    } finally {
      setLoadingSpeakers(false);
    }
  }, []);

  // ── Fetch series for dropdown ──
  const fetchSeries = useCallback(async () => {
    setLoadingSeries(true);
    try {
      const res = await fetch("/api/wp/speakers?type=series");
      const data = await res.json();
      if (data.series) {
        setSeriesList(data.series);
      }
    } catch {
      console.error("Failed to load series");
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  useEffect(() => {
    fetchContent(activeTab, contentPage);
  }, [activeTab, contentPage, fetchContent]);

  useEffect(() => {
    fetchSpeakers();
    fetchSeries();
  }, [fetchSpeakers, fetchSeries]);

  // ── Handle tab switch ──
  const handleTabSwitch = (tab: ContentType) => {
    setActiveTab(tab);
    setViewMode("list");
    setContentPage(1);
    sermonForm.reset();
    textForm.reset();
    setAudioFileName(null);
    setThumbnailPreview(null);
    setThumbnailFileName(null);
    setUploadedMediaId(null);
  };

  // ── Handle Audio file selection ──
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      sermonForm.setValue("audioFile", e.target.files);
    }
  };

  // ── Handle Edit Click ──
  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content || item.excerpt || "");
    setEditStatus(item.status as "draft" | "publish");
    // Pre-populate sermon-specific fields
    setEditDate(
      item.date ? new Date(item.date).toISOString().split("T")[0] : "",
    );
    setEditSpeaker(item.speaker || "");
    // Try to find matching series ID from the series list
    const matchedSeries = seriesList.find((s) => s.title === item.series);
    setEditSeriesId(matchedSeries ? String(matchedSeries.id) : "");
    setEditThumbnailPreview(item.thumbnail || null);
    setEditUploadedMediaId(null); // Will be set if user uploads a new one
    setEditUploadingThumbnail(false);
  };

  // ── Handle Edit Thumbnail Upload ──
  const handleEditThumbnailSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview
    const reader = new FileReader();
    reader.onload = () => setEditThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
    // Upload
    setEditUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/wp/upload-media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.mediaId) {
        setEditUploadedMediaId(data.mediaId);
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

  // ── Save Edit ──
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        id: editingItem.id,
        title: editTitle,
        content: editContent,
        status: editStatus,
      };
      // Include date if changed (for sermons)
      if (editDate) {
        payload.date = new Date(editDate).toISOString();
      }
      // Include featured media if a new thumbnail was uploaded
      if (editUploadedMediaId) {
        payload.featuredMediaId = editUploadedMediaId;
      }
      // Include categories if series was selected (for sermons)
      if (editSeriesId) {
        payload.categories = [Number(editSeriesId)];
      }

      const res = await fetch("/api/wp/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Post updated successfully!", {
          description: `Post #${data.postId} saved.`,
        });
        setEditingItem(null);
        fetchContent(activeTab, contentPage);
      } else {
        toast.error("Failed to update", {
          description: data.error || "Unknown error",
        });
      }
    } catch {
      toast.error("Save failed", {
        description: "Could not reach the server.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Handle Thumbnail image selection & upload ──
  const handleThumbnailSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    setThumbnailFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to WordPress Media Library
    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/wp/upload-media", {
        method: "POST",
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

  // ── Sermon submit (with audio) ──
  const onSermonSubmit = async (data: SermonFormData) => {
    setPublishing(true);

    try {
      const contentParts = [];
      if (data.speaker)
        contentParts.push(`<p><strong>Minister:</strong> ${data.speaker}</p>`);
      if (data.description) contentParts.push(`<p>${data.description}</p>`);
      if (!contentParts.length)
        contentParts.push(`<p>Audio sermon uploaded via admin dashboard.</p>`);

      const res = await fetch("/api/wp/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        fetchContent(activeTab, 1);
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

  // ── Text content submit (transcripts & manuals) ──
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

    try {
      const res = await fetch("/api/wp/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Published successfully!", {
          description: `Post ID: ${result.postId}`,
          action: result.postUrl
            ? {
                label: "View Post",
                onClick: () => window.open(result.postUrl, "_blank"),
              }
            : undefined,
        });
        textForm.reset();
        setViewMode("list");
        fetchContent(activeTab, 1);
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
          <button
            onClick={() => setViewMode("create")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New {currentTab.label.slice(0, -1)}
          </button>
        ) : (
          <button
            onClick={() => setViewMode("list")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            View Published
          </button>
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
              {/* Card header */}
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
                <button
                  onClick={() => fetchContent(activeTab, contentPage)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingContent ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Content list */}
              <div className="p-4 sm:p-6">
                {loadingContent ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm">Loading content…</p>
                  </div>
                ) : contentItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <currentTab.icon className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-medium">
                      No {currentTab.label.toLowerCase()} found
                    </p>
                    <p className="text-xs mt-1">
                      Create your first one by clicking the button above
                    </p>
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

                {/* Pagination */}
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

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Content synced from WordPress at ikorodu.nlwc.church
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
              {/* Card header */}
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

              {/* ─────── SERMON FORM (Audio Upload) ─────── */}
              {activeTab === "sermon" && (
                <form
                  onSubmit={sermonForm.handleSubmit(onSermonSubmit)}
                  className="p-6 sm:p-8 space-y-6"
                >
                  {/* Title */}
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

                  {/* Speaker Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Speaker / Minister
                    </label>
                    <div className="relative">
                      <select
                        {...sermonForm.register("speaker")}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
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
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Series Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Series / Category
                    </label>
                    <div className="relative">
                      <select
                        {...sermonForm.register("seriesId")}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
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
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
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

                  {/* Sermon Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sermon Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        {...sermonForm.register("sermonDate")}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Thumbnail Image Upload */}
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
                        {/* Preview image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-48 object-cover"
                        />
                        {/* Upload status overlay */}
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

                  {/* Audio File Upload */}
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

                    <button
                      type="submit"
                      disabled={publishing}
                      className="flex-1 sm:flex-none sm:min-w-[200px] h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                    </button>
                  </div>
                </form>
              )}

              {/* ─────── TRANSCRIPT FORM (Rich Text) ─────── */}
              {activeTab === "transcript" && (
                <form
                  onSubmit={textForm.handleSubmit(onTextSubmit)}
                  className="p-6 sm:p-8 space-y-6"
                >
                  {/* Title */}
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

                  {/* Transcript Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transcript Type <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        {...textForm.register("transcriptType")}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                      >
                        <option value="sunday-message">
                          Sunday Message Transcript
                        </option>
                        <option value="sunday-school">
                          Sunday School Transcript
                        </option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Speaker Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Speaker / Minister
                    </label>
                    <div className="relative">
                      <select
                        {...textForm.register("speaker")}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
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
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Rich Text Content */}
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

                  {/* Status & Submit */}
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

                    <button
                      type="submit"
                      disabled={publishing}
                      className="flex-1 sm:flex-none sm:min-w-[200px] h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                    </button>
                  </div>
                </form>
              )}

              {/* ─────── MANUAL FORM (Rich Text) ─────── */}
              {activeTab === "manual" && (
                <form
                  onSubmit={textForm.handleSubmit(onTextSubmit)}
                  className="p-6 sm:p-8 space-y-6"
                >
                  {/* Title */}
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

                  {/* Rich Text Content */}
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

                  {/* Status & Submit */}
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

                    <button
                      type="submit"
                      disabled={publishing}
                      className="flex-1 sm:flex-none sm:min-w-[200px] h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                    </button>
                  </div>
                </form>
              )}

              {/* Footer */}
              <div className="px-6 sm:px-8 py-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Content will be published to the WordPress database at
                  ikorodu.nlwc.church
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setEditingItem(null)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
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

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Title */}
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

                {/* Speaker Dropdown - Sermon only */}
                {activeTab === "sermon" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Speaker / Minister
                    </label>
                    <div className="relative">
                      <select
                        value={editSpeaker}
                        onChange={(e) => setEditSpeaker(e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
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
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Series Dropdown - Sermon only */}
                {activeTab === "sermon" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Series / Category
                    </label>
                    <div className="relative">
                      <select
                        value={editSeriesId}
                        onChange={(e) => setEditSeriesId(e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
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
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Content / Description */}
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

                {/* Sermon Date - Sermon only */}
                {activeTab === "sermon" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sermon Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Thumbnail - Sermon only */}
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

                {/* Status */}
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

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-5 h-10 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-6 h-10 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
