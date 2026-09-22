"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Link as LinkIcon,
  Quote,
} from "lucide-react";
import { showPrompt } from "@/components/shared/CustomDialog";
import { SelectField } from "@/components/shared/SelectField";
import { cleanInlineStyles } from "@/utils/sanitizeWP";

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

export function RichTextEditor({
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
