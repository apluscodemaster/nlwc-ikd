"use client";

import {
  FileText,
  BookOpen,
  Music,
  Calendar,
  User,
  Pencil,
} from "lucide-react";
import type { ContentItem, ContentType } from "./types";

export function ContentListItem({
  item,
  type,
  onEdit,
}: {
  item: ContentItem;
  type: ContentType;
  onEdit?: (item: ContentItem) => void;
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
      {type === "sermon" && item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
            type === "sermon"
              ? "from-primary/10 to-amber-500/10"
              : type === "transcript"
                ? "from-blue-500/10 to-indigo-500/10"
                : "from-emerald-500/10 to-teal-500/10"
          }`}
        >
          {type === "sermon" ? (
            <Music className="w-5 h-5 text-primary" />
          ) : type === "transcript" ? (
            <FileText className="w-5 h-5 text-blue-500" />
          ) : (
            <BookOpen className="w-5 h-5 text-emerald-500" />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
          {item.title}
        </h4>
        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1.5">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.date}
          </span>
          {item.speaker && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {item.speaker}
            </span>
          )}
          {item.series && (
            <span className="text-xs text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full">
              {item.series}
            </span>
          )}
          {item.transcriptType && (
            <span className="text-xs text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
              {item.transcriptType.replace("-", " ")}
            </span>
          )}
        </div>
        {item.excerpt && (
          <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 italic">
            {item.excerpt}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="w-8 h-8 flex items-center justify-center rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-primary/10 text-gray-400 hover:text-primary transition-all cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            item.status === "publish"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {item.status === "publish" ? "Live" : "Draft"}
        </span>
      </div>
    </div>
  );
}
