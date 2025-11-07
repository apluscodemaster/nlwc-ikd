"use client";

import React, { useEffect, useState } from "react";
import { HiDownload } from "react-icons/hi";
import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

const GalleryImage: React.FC<Props> = ({
  src,
  alt,
  width: initialWidth,
  height: initialHeight,
}) => {
  const [imgDims, setImgDims] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // If caller provided dimensions, use them
    if (initialWidth && initialHeight) {
      setImgDims({ width: initialWidth, height: initialHeight });
      return;
    }

    // Try to auto-detect image dimensions for remote images
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImgDims({
        width: img.naturalWidth || DEFAULT_WIDTH,
        height: img.naturalHeight || DEFAULT_HEIGHT,
      });
    };
    // fallback if error
    img.onerror = () => {
      setImgDims({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    };
  }, [src, initialWidth, initialHeight]);

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

  // Use detected or default dimensions
  const width = imgDims?.width || DEFAULT_WIDTH;
  const height = imgDims?.height || DEFAULT_HEIGHT;

  return (
    <figure className="relative group">
      <Image
        src={src.trim()}
        alt={alt || "Gallery image"}
        width={width}
        height={height}
        className="w-full block rounded-md shadow-sm object-cover"
        style={{ aspectRatio: `${width}/${height}` }}
        unoptimized
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
};

export default GalleryImage;
