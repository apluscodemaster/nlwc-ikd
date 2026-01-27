import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toGoogleImageURL } from "@/utils/driveImage";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";

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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog>
      <figure className="relative group overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
        {!imgDims ? (
          <Skeleton
            className="w-full"
            style={{
              aspectRatio:
                initialWidth && initialHeight
                  ? `${initialWidth}/${initialHeight}`
                  : "3/2",
            }}
          />
        ) : (
          <>
            <DialogTrigger asChild>
              <div className="relative cursor-zoom-in">
                <Image
                  src={displaySrc}
                  alt={alt || "Gallery image"}
                  width={width}
                  height={height}
                  className="w-full block object-cover opacity-0 transition-all duration-700 group-hover:scale-105"
                  style={{ aspectRatio: `${width}/${height}` }}
                  unoptimized
                  onLoadingComplete={(img) => img.classList.remove("opacity-0")}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ZoomIn className="text-white w-8 h-8 scale-50 group-hover:scale-100 transition-transform duration-300" />
                </div>
              </div>
            </DialogTrigger>

            <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-white/90 hover:bg-white text-black font-medium gap-2 h-8 px-3 rounded-lg shadow-lg backdrop-blur-md"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-xs">Download</span>
              </Button>
            </div>
          </>
        )}
      </figure>

      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-transparent border-none shadow-none">
        <VisuallyHidden>
          <DialogTitle>{alt || "Gallery Image Preview"}</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={downloadSrc}
            alt={alt || "Full resolution gallery image"}
            width={1920}
            height={1080}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryImage;
