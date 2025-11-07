"use client";

import React, { useEffect, useState } from "react";
import { HiDownload } from "react-icons/hi";
import Image from "next/image";
import { toGoogleImageURL } from "@/utils/driveImage";

type Props = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

const Shimmer = () => (
  <div className="w-full h-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md" />
);

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
    if (initialWidth && initialHeight) {
      setImgDims({ width: initialWidth, height: initialHeight });
      return;
    }

    const img = new window.Image();
    const probeSrc = toGoogleImageURL(src);
    img.src = probeSrc;
    img.onload = () =>
      setImgDims({
        width: img.naturalWidth || DEFAULT_WIDTH,
        height: img.naturalHeight || DEFAULT_HEIGHT,
      });
    img.onerror = () =>
      setImgDims({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  }, [src, initialWidth, initialHeight]);

  const width = imgDims?.width || DEFAULT_WIDTH;
  const height = imgDims?.height || DEFAULT_HEIGHT;

  const baseUrl = toGoogleImageURL(src);
  const isDrive = baseUrl.includes("lh3.googleusercontent.com");

  // Use a flexible image URL: prefer high-res
  const displaySrc = isDrive ? `${baseUrl}=w${width}-h${height}-no` : baseUrl;
  const downloadSrc = isDrive ? `${baseUrl}=s0` : baseUrl;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const a = document.createElement("a");
      a.href = downloadSrc;
      a.download = downloadSrc.split("/").pop()?.split("?")[0] || "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed", err);
      alert(
        "Couldn't download image. Try opening it in a new tab and saving it."
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <figure className="relative group overflow-hidden rounded-md">
      {!imgDims ? (
        <Shimmer />
      ) : (
        <Image
          src={displaySrc}
          alt={alt || "Gallery image"}
          width={width}
          height={height}
          className="w-full block rounded-md shadow-sm object-cover opacity-0 transition-opacity duration-700"
          style={{ aspectRatio: `${width}/${height}` }}
          unoptimized
          onLoadingComplete={(img) => img.classList.remove("opacity-0")}
        />
      )}
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
