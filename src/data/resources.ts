import { FileText, Book, MessageSquare } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type Resource = {
  id: string;
  title: string;
  category: "Manual" | "Transcription" | "Study Guide" | "Newsletter";
  date: string;
  size: string;
  fileType: string;
  icon: LucideIcon;
};

export const resources: Resource[] = [
  {
    id: "1",
    title: "Sunday School Manual - Q1 2026",
    category: "Manual",
    date: "Jan 01, 2026",
    size: "2.4 MB",
    fileType: "PDF",
    icon: Book,
  },
  {
    id: "2",
    title: "Walking in Divine Purpose - Transcript",
    category: "Transcription",
    date: "Jan 27, 2026",
    size: "1.2 MB",
    fileType: "PDF",
    icon: FileText,
  },
  {
    id: "3",
    title: "House Fellowship Discussion Guide",
    category: "Study Guide",
    date: "Jan 20, 2026",
    size: "800 KB",
    fileType: "PDF",
    icon: MessageSquare,
  },
  {
    id: "4",
    title: "The Power of Persistent Prayer - Transcript",
    category: "Transcription",
    date: "Jan 20, 2026",
    size: "1.1 MB",
    fileType: "PDF",
    icon: FileText,
  },
  {
    id: "5",
    title: "Monthly Newsletter - January 2026",
    category: "Newsletter",
    date: "Jan 01, 2026",
    size: "3.5 MB",
    fileType: "PDF",
    icon: FileText,
  },
];
