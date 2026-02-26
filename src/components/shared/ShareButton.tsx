"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator
        .share({
          title,
          url,
        })
        .catch((error) => {
          // User cancelled or error occurred
          console.log("Share cancelled or failed:", error);
        });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Link copied to clipboard!");
      });
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 hover:text-primary transition-colors ml-auto"
      aria-label="Share this transcript"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  );
}
