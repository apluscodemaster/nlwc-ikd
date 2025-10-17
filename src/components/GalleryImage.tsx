// components/GalleryImage.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  alt?: string;
};

export default function GalleryImage({ src, alt }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      setLoading(false);
      if (img.naturalHeight > img.naturalWidth) setOrientation('portrait');
      else setOrientation('landscape');
    }
    const onLoad = () => {
      setLoading(false);
      if (img.naturalHeight > img.naturalWidth) setOrientation('portrait');
      else setOrientation('landscape');
    };
    img.addEventListener('load', onLoad);
    return () => img.removeEventListener('load', onLoad);
  }, [src]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Try simple anchor download first
      const a = document.createElement('a');
      a.href = src;
      // Try to infer filename
      const filename = src.split('/').pop()?.split('?')[0] || 'image';
      a.download = filename;
      // Some cross-origin images might not download this way; attempt fetch+blob as fallback
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      // fallback: fetch blob then download
      try {
        const resp = await fetch(src, { mode: 'cors' });
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = src.split('/').pop()?.split('?')[0] || 'image';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } catch (e) {
        console.error('Download failed', e);
        alert('Download failed (CORS or network). Try opening the image in a new tab and saving it.');
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
        className={`w-full block rounded-md shadow-sm object-cover ${orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-video'}`}
      />

      {/* overlay: show on hover desktop, always visible small screens */}
      <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={handleDownload}
            className="bg-white/90 hover:bg-white px-3 py-1 rounded-md text-sm shadow-sm backdrop-blur-sm"
          >
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
    </figure>
  );
}
