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
import { cn } from "@/lib/utils";

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
      <figure className="relative group overflow-hidden rounded-[32px] border border-gray-100 shadow-sm transition-all duration-700 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 bg-gray-50">
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
              <div className="relative cursor-zoom-in overflow-hidden">
                <Image
                  src={displaySrc}
                  alt={alt || "Gallery image"}
                  width={width}
                  height={height}
                  className="w-full block object-cover opacity-0 transition-all duration-1000 group-hover:scale-110"
                  style={{ aspectRatio: `${width}/${height}` }}
                  unoptimized
                  onLoadingComplete={(img) => img.classList.remove("opacity-0")}
                />

                {/* Visual Overlay on Hover */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 shadow-2xl">
                    <ZoomIn className="text-white w-6 h-6" />
                  </div>
                </div>
              </div>
            </DialogTrigger>

            <div className="absolute bottom-4 right-4 z-10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl font-bold gap-2 h-10 px-5 rounded-2xl shadow-2xl transition-all active:scale-95"
              >
                <Download
                  className={cn("h-4 w-4", downloading && "animate-bounce")}
                />
                <span className="text-xs uppercase tracking-widest">
                  {downloading ? "Saving..." : "Download"}
                </span>
              </Button>
            </div>
          </>
        )}
      </figure>

      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none shadow-2xl backdrop-blur-2xl">
        <VisuallyHidden>
          <DialogTitle>{alt || "Gallery Image Preview"}</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-[95vh] flex items-center justify-center p-4">
          <Image
            src={downloadSrc}
            alt={alt || "Full resolution gallery image"}
            width={1920}
            height={1080}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-500"
            unoptimized
          />

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleDownload}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl font-bold gap-3 h-14 px-8 rounded-full shadow-2xl transition-all active:scale-95"
            >
              <Download className="h-5 w-5" />
              <span>Save High Resolution Image</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryImage;
