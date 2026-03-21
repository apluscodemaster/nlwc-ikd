import React from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  containerClassName?: string;
}

export default function SectionContainer({
  children,
  className,
  id,
  containerClassName,
}: SectionContainerProps) {
  return (
    <section id={id} className={cn("py-12 sm:py-32", className)}>
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6", containerClassName)}>
        {children}
      </div>
    </section>
  );
}
