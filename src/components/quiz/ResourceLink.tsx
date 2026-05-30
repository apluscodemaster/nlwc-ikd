"use client";

import { useState } from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { InlineResourceDrawer } from "./InlineResourceDrawer";

interface ResourceLinkProps {
  href: string;
  variant: "listen" | "read";
  title?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function ResourceLink({
  href,
  variant,
  title,
  onClick,
  className,
  children,
}: ResourceLinkProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          className={className}
          onClick={() => {
            onClick?.();
            setDrawerOpen(true);
          }}
        >
          {children}
        </button>

        <InlineResourceDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          href={href}
          variant={variant}
          title={title}
          onInteracted={onClick}
        />
      </>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => onClick?.()}
    >
      {children}
    </Link>
  );
}
