"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

/**
 * PDF.js, served from this site via a rewrite to jsDelivr (next.config.ts
 * "/vendor/pdfjs/:file"), so its worker is same-origin.
 */
const PDFJS_URL = "/vendor/pdfjs/pdf.min.mjs";
const PDFJS_WORKER_URL = "/vendor/pdfjs/pdf.worker.min.mjs";

interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { url: string }) => {
    promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getViewport: (o: { scale: number }) => {
          width: number;
          height: number;
        };
        render: (o: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
      }>;
    }>;
  };
}

let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= (
    import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ PDFJS_URL
    ) as Promise<PdfJs>
  ).then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    return pdfjs;
  });
  return pdfjsPromise;
}

/**
 * Shows a devotional PDF on the page with PDF.js. The file is read through
 * /api/devotionals/pdf (same origin), so it works for S3 and Cloudinary
 * links alike. If anything fails, it falls back to Google's viewer and a
 * direct link. Google's viewer used to be the only option and often stayed
 * blank ("No preview available") for files it hadn't seen before.
 */
export default function PdfViewer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    container.replaceChildren();
    setState("loading");

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({
          url: `/api/devotionals/pdf?src=${encodeURIComponent(src)}`,
        }).promise;
        const width = container.clientWidth || 800;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= doc.numPages && !cancelled; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({
            scale: (width / base.width) * ratio,
          });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "block bg-white shadow-sm rounded-lg";
          canvas.setAttribute("role", "img");
          canvas.setAttribute(
            "aria-label",
            `${title}, page ${n} of ${doc.numPages}`,
          );
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("No canvas");
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
          if (n === 1) setState("ready");
        }
      } catch (err) {
        console.warn("[PdfViewer] falling back to Google viewer:", err);
        if (!cancelled) setState("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src, title]);

  if (state === "failed") {
    return (
      <div className="flex h-full flex-col">
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`}
          className="w-full flex-1 border-none"
          title={title}
        />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Not showing? Open the PDF
        </a>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {state === "loading" && (
        <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading devotional…
        </div>
      )}
      <div
        ref={containerRef}
        className="mx-auto flex max-w-3xl flex-col gap-4 p-2 sm:p-4"
      />
    </div>
  );
}
