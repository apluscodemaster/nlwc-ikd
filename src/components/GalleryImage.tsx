"use client";

import React, { useEffect, useRef, useState } from "react";
import { HiDownload } from "react-icons/hi"; // ✅ added icon

type Props = {
  src: string;
  alt?: string;
};

export default function GalleryImage({ src, alt }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "landscape"
  );
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleOrientation = () => {
      setLoading(false);
      if (img.naturalHeight > img.naturalWidth) setOrientation("portrait");
      else setOrientation("landscape");
    };

    if (img.complete) handleOrientation();
    else img.addEventListener("load", handleOrientation);

    return () => img.removeEventListener("load", handleOrientation);
  }, [src]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = src;
      const filename = src.split("/").pop()?.split("?")[0] || "image";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try {
        const resp = await fetch(src, { mode: "cors" });
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = src.split("/").pop()?.split("?")[0] || "image";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } catch (e) {
        console.error("Download failed", e);
        alert(
          "Download failed (CORS or network). Try opening the image in a new tab and saving it."
        );
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <figure className="relative group">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full block rounded-md shadow-sm object-cover ${
          orientation === "portrait" ? "aspect-[3/4]" : "aspect-video"
        }`}
      />

      {/* Overlay Button */}
      <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-white/90 cursor-pointer hover:bg-white px-3 text-black py-1 rounded-md text-sm shadow-sm backdrop-blur-sm transition-all"
          >
            <HiDownload className="text-lg" />
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </figure>
  );
}
