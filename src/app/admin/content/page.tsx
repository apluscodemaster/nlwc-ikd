"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  CheckCircle2,
  Eye,
  X,
  RefreshCw,
  Plus,
  Pencil,
  Save,
  List,
  Layers,
} from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import ManualThemeBoard from "@/components/admin/ManualThemeBoard";
import { scheduledPublishDateTime } from "@/utils/publishSchedule";
import { getAuthorizationHeader } from "@/lib/authClient";
import {
  TABS,
  TRANSCRIPT_TYPE_TO_CATEGORY,
  type ContentItem,
  type ContentType,
  type PostStatus,
  type SermonFormData,
  type TextFormData,
  type TranscriptType,
  type ViewMode,
} from "@/components/admin/content/types";
import {
  todayInputValue,
  toDateInputValue,
  withSpeakerLine,
  stripLeadingSpeakerLine,
} from "@/components/admin/content/contentHelpers";
import { ContentListItem } from "@/components/admin/content/ContentListItem";
import { useSermonTaxonomy } from "@/components/admin/content/useSermonTaxonomy";
import {
  ThumbnailField,
  useThumbnailUpload,
} from "@/components/admin/content/ThumbnailField";
import {
  AUDIO_URL_PATTERN,
  AudioUrlField,
  ContentField,
  MinisterField,
  PublishDateField,
  SeriesField,
  StatusField,
  TitleField,
  TranscriptTypeField,
} from "@/components/admin/content/fields";

// ─── Edit modal state ─────────────────────────────────────────────────────────
interface EditState {
  title: string;
  content: string;
  status: PostStatus;
  date: string;
  speaker: string;
  seriesId: string;
  audioUrl: string;
  transcriptType: TranscriptType;
  /** The type the post had when the modal opened. Saving only writes a
   *  category back when this differs from the selector, so opening a
   *  transcript and editing (say) its title can never silently re-file it. */
  originalTranscriptType: TranscriptType;
}

/** Status pill + submit button that closes every create form. */
function SubmitBar({
  statusField,
  publishing,
  label,
}: {
  statusField: React.ReactNode;
  publishing: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-gray-100">
      {statusField}
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
            {label}
          </>
        )}
      </Button>
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

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentPage, setContentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Ministers & series — one loader and one "add new" path for every form.
  const taxonomy = useSermonTaxonomy();

  // Create-form thumbnail (sermons) and edit-modal thumbnail share one hook.
  const createThumb = useThumbnailUpload();
  const editThumb = useThumbnailUpload();

  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const patchEdit = (patch: Partial<EditState>) =>
    setEdit((prev) => (prev ? { ...prev, ...patch } : prev));

  const sermonForm = useForm<SermonFormData>({
    defaultValues: {
      title: "",
      status: "draft",
      speaker: "",
      seriesId: "",
      description: "",
      sermonDate: todayInputValue(),
      audioUrl: "",
    },
  });

  const textForm = useForm<TextFormData>({
    defaultValues: {
      title: "",
      content: "",
      status: "draft",
      speaker: "",
      transcriptType: "sunday-message",
      // Default to today so leaving it untouched publishes immediately;
      // choosing a later date schedules it.
      publishDate: todayInputValue(),
    },
  });

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
          // The edit modal prefills straight from these items, so a stale
          // response would silently reopen a post with out-of-date content or
          // category. Never serve this list from the browser cache.
          { cache: "no-store" },
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

  // ── Handle tab switch ───────────────────────────────────────────────────────
  const handleTabSwitch = (tab: ContentType) => {
    setActiveTab(tab);
    setViewMode("list");
    setContentPage(1);
    setSearchQuery("");
    setDebouncedSearch("");
    sermonForm.reset();
    textForm.reset();
    createThumb.reset();
  };

  // ── Edit item ───────────────────────────────────────────────────────────────
  const handleEditItem = (item: ContentItem) => {
    const currentType =
      (item.transcriptType as TranscriptType) ?? "sunday-message";
    const matchedSeries = taxonomy.seriesList.find(
      (s) => s.title === item.series,
    );
    const rawContent = item.content || item.excerpt || "";
    setEditingItem(item);
    setEdit({
      title: item.title,
      // Sermons: drop any stray leading "Minister: …" line so the admin sees
      // the real description. Rows written before that injection was removed
      // still carry it; not re-adding it on save cleans them up.
      content:
        activeTab === "sermon" ? stripLeadingSpeakerLine(rawContent) : rawContent,
      // A scheduled post comes back as "future", which matches neither option
      // in the Status select (it rendered blank). Treat it as "publish" — the
      // future date below is what re-schedules it on save.
      status: item.status === "draft" ? "draft" : "publish",
      // Prefer the raw WP timestamp: it is the only source that still has the
      // time. `item.date` is a formatted label ("Jul 28, 2026") whose time the
      // save used to replace with a hardcoded noon, silently moving schedules.
      date: toDateInputValue(item.dateIso || item.date),
      speaker: item.speaker || "",
      seriesId: matchedSeries ? String(matchedSeries.id) : "",
      // Prefill with the existing MP3 URL (real audio_url when the message has one).
      audioUrl: item.audioUrl || "",
      transcriptType: currentType,
      originalTranscriptType: currentType,
    });
    editThumb.reset(item.thumbnail || null);
  };

  const closeEdit = () => {
    setEditingItem(null);
    setEdit(null);
  };

  // ── Save edit ───────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editingItem || !edit) return;
    setSaving(true);
    try {
      // Get Firebase ID token once and reuse for all requests in this handler
      const authHeader = await getAuthorizationHeader();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        id: editingItem.id,
        type: activeTab,
        title: edit.title,
        // The Minister line reflects the speaker dropdown: any existing leading
        // Minister/Speaker line is stripped (start-anchored & safe — never
        // touches the body) and re-prepended from the selected speaker.
        content: withSpeakerLine(edit.content, edit.speaker, activeTab),
        status: edit.status,
        speaker: edit.speaker,
      };
      // No time picker anywhere: a future date takes the 12:30 AM release slot,
      // while anything already published keeps the exact time it went out —
      // passing the post's own timestamp is what preserves it.
      const editPublishAt = scheduledPublishDateTime(
        edit.date,
        editingItem.dateIso,
      );
      if (editPublishAt) {
        payload.date = editPublishAt;
        // A future moment means "schedule it": WordPress stores the post as
        // "future" and publishes then. Leaving status "publish" with a future
        // date would otherwise depend on WP inferring the intent.
        if (
          edit.status === "publish" &&
          new Date(editPublishAt).getTime() > Date.now()
        ) {
          payload.status = "future";
        }
      }
      if (editThumb.state.mediaId) {
        payload.featuredMediaId = editThumb.state.mediaId;
      }
      if (activeTab === "sermon") {
        // Sermons are Series Engine messages: the MP3 and thumbnail are URLs,
        // and the series is reassigned via seriesId (mapped to series_id). The
        // thumbnail must be sent as a URL (message_thumbnail) — the media ID in
        // featuredMediaId is ignored by the Series Engine update.
        if (edit.audioUrl) payload.audioUrl = edit.audioUrl;
        if (editThumb.state.mediaUrl) {
          payload.thumbnailUrl = editThumb.state.mediaUrl;
        }
        if (edit.seriesId) payload.seriesId = Number(edit.seriesId);
        const speakerId = taxonomy.speakerIdFor(edit.speaker);
        if (speakerId) payload.speakerId = speakerId;
      } else if (
        activeTab === "transcript" &&
        edit.transcriptType !== edit.originalTranscriptType
      ) {
        // Write the transcript type back as its WP category — but ONLY when the
        // selector actually changed. Sending it unconditionally re-filed every
        // edited transcript under whatever the selector happened to show.
        // Omitting the key entirely leaves the post's categories untouched.
        payload.categories = [TRANSCRIPT_TYPE_TO_CATEGORY[edit.transcriptType]];
      }

      const res = await fetch("/api/wp/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Post updated successfully!", {
          description: `Post #${data.postId} saved.`,
        });
        closeEdit();
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

  // ── Sermon submit ───────────────────────────────────────────────────────────
  const onSermonSubmit = async (data: SermonFormData) => {
    setPublishing(true);
    try {
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
          speakerId: taxonomy.speakerIdFor(data.speaker),
          description: data.description || undefined,
          seriesId: data.seriesId || undefined,
          date: data.sermonDate || undefined,
          thumbnailUrl: createThumb.state.mediaUrl || undefined,
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
        createThumb.reset();
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

    // Date-only scheduling. A future date means the user wants the post
    // scheduled, so force status "publish" — WordPress then stores it as
    // "future" and auto-publishes at the 12:30 AM release slot. (Otherwise a
    // future date left on the default "Draft" toggle just saves a draft, which
    // is surprising for something explicitly given a later publish date.)
    const publishAt = scheduledPublishDateTime(data.publishDate);
    const isScheduled =
      !!publishAt && new Date(publishAt).getTime() > Date.now();
    if (publishAt) payload.date = publishAt;
    if (isScheduled) payload.status = "publish";

    try {
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

  // Shared select props — every form and the modal render the same lists.
  const ministerProps = {
    speakers: taxonomy.speakers,
    loading: taxonomy.loadingSpeakers,
    onAdd: taxonomy.addSpeaker,
  };
  const seriesProps = {
    series: taxonomy.seriesList,
    loading: taxonomy.loadingSeries,
    onAdd: taxonomy.addSeries,
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
                  <Controller
                    name="title"
                    control={sermonForm.control}
                    rules={{ required: "Title is required" }}
                    render={({ field, fieldState }) => (
                      <TitleField
                        label="Sermon Title"
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Enter sermon title…"
                      />
                    )}
                  />

                  <Controller
                    name="speaker"
                    control={sermonForm.control}
                    render={({ field }) => (
                      <MinisterField
                        value={field.value}
                        onChange={field.onChange}
                        {...ministerProps}
                      />
                    )}
                  />

                  <Controller
                    name="seriesId"
                    control={sermonForm.control}
                    render={({ field }) => (
                      <SeriesField
                        value={field.value}
                        onChange={field.onChange}
                        {...seriesProps}
                      />
                    )}
                  />

                  <Controller
                    name="description"
                    control={sermonForm.control}
                    render={({ field }) => (
                      <ContentField
                        type="sermon"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  <Controller
                    name="sermonDate"
                    control={sermonForm.control}
                    render={({ field }) => (
                      <PublishDateField
                        type="sermon"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  <ThumbnailField upload={createThumb} />

                  <Controller
                    name="audioUrl"
                    control={sermonForm.control}
                    rules={{
                      required: "Audio MP3 URL is required",
                      pattern: {
                        value: AUDIO_URL_PATTERN,
                        message: "Enter a valid URL starting with http(s)://",
                      },
                    }}
                    render={({ field, fieldState }) => (
                      <AudioUrlField
                        required
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />

                  <SubmitBar
                    publishing={publishing}
                    label="Publish Sermon"
                    statusField={
                      <Controller
                        name="status"
                        control={sermonForm.control}
                        render={({ field }) => (
                          <StatusField
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    }
                  />
                </form>
              )}

              {/* ─────── TRANSCRIPT & MANUAL FORMS ─────── */}
              {activeTab !== "sermon" && (
                <form
                  onSubmit={textForm.handleSubmit(onTextSubmit)}
                  className="p-6 sm:p-8 space-y-6"
                >
                  <Controller
                    name="title"
                    control={textForm.control}
                    rules={{ required: "Title is required" }}
                    render={({ field, fieldState }) => (
                      <TitleField
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder={`Enter ${activeTab} title…`}
                      />
                    )}
                  />

                  {activeTab === "transcript" && (
                    <>
                      <Controller
                        name="transcriptType"
                        control={textForm.control}
                        render={({ field }) => (
                          <TranscriptTypeField
                            required
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        name="speaker"
                        control={textForm.control}
                        render={({ field }) => (
                          <MinisterField
                            value={field.value}
                            onChange={field.onChange}
                            {...ministerProps}
                          />
                        )}
                      />
                    </>
                  )}

                  <Controller
                    name="content"
                    control={textForm.control}
                    rules={{ required: "Content is required" }}
                    render={({ field, fieldState }) => (
                      <ContentField
                        required
                        type={activeTab}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />

                  <Controller
                    name="publishDate"
                    control={textForm.control}
                    render={({ field }) => (
                      <PublishDateField
                        type={activeTab}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  <SubmitBar
                    publishing={publishing}
                    label={`Publish ${currentTab.label.slice(0, -1)}`}
                    statusField={
                      <Controller
                        name="status"
                        control={textForm.control}
                        render={({ field }) => (
                          <StatusField
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    }
                  />
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
        {editingItem && edit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={closeEdit}
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
                      Edit {currentTab.label.slice(0, -1)}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Post #{editingItem.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeEdit}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <TitleField
                  required={false}
                  value={edit.title}
                  onChange={(title) => patchEdit({ title })}
                />

                {activeTab !== "manual" && (
                  <MinisterField
                    value={edit.speaker}
                    onChange={(speaker) => patchEdit({ speaker })}
                    {...ministerProps}
                  />
                )}

                {activeTab === "transcript" && (
                  <TranscriptTypeField
                    value={edit.transcriptType}
                    onChange={(transcriptType) => patchEdit({ transcriptType })}
                  />
                )}

                {activeTab === "sermon" && (
                  <SeriesField
                    value={edit.seriesId}
                    onChange={(seriesId) => patchEdit({ seriesId })}
                    {...seriesProps}
                  />
                )}

                <ContentField
                  type={activeTab}
                  value={edit.content}
                  onChange={(content) => patchEdit({ content })}
                  placeholder={
                    activeTab === "sermon" ? "Description / notes…" : "Edit content…"
                  }
                />

                <PublishDateField
                  type={activeTab}
                  value={edit.date}
                  onChange={(date) => patchEdit({ date })}
                  originalIso={editingItem.dateIso}
                />

                {activeTab === "sermon" && (
                  <>
                    <ThumbnailField upload={editThumb} compact />
                    <AudioUrlField
                      value={edit.audioUrl}
                      onChange={(audioUrl) => patchEdit({ audioUrl })}
                      hint="Link to the hosted MP3 (e.g. AWS S3). Leave unchanged to keep the current audio."
                    />
                  </>
                )}

                <StatusField
                  variant="block"
                  value={edit.status}
                  onChange={(status) => patchEdit({ status })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <Button
                  variant="ghost"
                  size="none"
                  onClick={closeEdit}
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
