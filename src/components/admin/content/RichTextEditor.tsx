"use client";

import React, { useRef, useEffect } from "react";
import {
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
