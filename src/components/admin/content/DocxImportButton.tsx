"use client";

import React, { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { showConfirm } from "@/components/shared/CustomDialog";
import { convertDocx, type DocxImportResult } from "@/utils/docxImport";

/**
 * "Import from Word" for the manual editor: converts a .docx in the browser
 * and hands the HTML (plus the TOPIC line as a title) to `onImport`. Asks
 * before replacing anything already typed into the editor.
 */
export function DocxImportButton({
  hasContent,
  onImport,
}: {
  /** Whether the editor already holds text that an import would replace. */
  hasContent: boolean;
  onImport: (result: DocxImportResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (hasContent) {
      const replace = await showConfirm(
        "Importing replaces everything currently in the editor. Continue?",
        {
          title: "Replace the current content?",
          variant: "warning",
          confirmLabel: "Replace",
        },
      );
      if (!replace) return;
    }

    setBusy(true);
    try {
      const result = await convertDocx(file);
      onImport(result);
      toast.success(`Imported “${file.name}”`, {
        description: [
          result.title ? "Title filled from the TOPIC line." : null,
          result.skippedImages
            ? `${result.skippedImages} image${result.skippedImages === 1 ? "" : "s"} not imported.`
            : null,
          "Review the formatting before publishing.",
        ]
          .filter(Boolean)
          .join(" "),
      });
    } catch (err) {
      toast.error("Couldn't import that document", {
        description:
          err instanceof Error && err.message
            ? err.message
            : "Make sure it's a Word (.docx) file that opens in Word.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so choosing the same file again still triggers onChange.
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileUp className="w-3.5 h-3.5" />
        )}
        {busy ? "Importing…" : "Import from Word"}
      </button>
    </>
  );
}
