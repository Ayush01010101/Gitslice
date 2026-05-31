"use client";

import { Search, X } from "lucide-react";
import { useState, useMemo } from "react";

export interface Commit {
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
}

interface CommitSidebarProps {
  commits: Commit[];
  selectedSha?: string;
  onSelectCommit: (sha: string) => void;
  onClose: () => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  isMobile?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "1 Day ago";
  if (diffDay < 7) return `${diffDay} Days ago`;
  if (diffWeek === 1) return "1 week ago";
  if (diffWeek < 5) return `${diffWeek} weeks ago`;
  if (diffMonth === 1) return "1 month ago";
  return `${diffMonth} months ago`;
}

/* ------------------------------------------------------------------ */

export default function CommitSidebar({
  commits,
  selectedSha,
  onSelectCommit,
  onClose,
  onLoadMore,
  loading = false,
  hasMore = true,
  isMobile = false,
}: CommitSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "branches" | "tags">(
    "all"
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return commits;
    const q = search.toLowerCase();
    return commits.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.sha.toLowerCase().startsWith(q) ||
        c.author.toLowerCase().includes(q)
    );
  }, [commits, search]);

  const tabs = [
    { key: "all" as const, label: "All" },
    { key: "branches" as const, label: "Branches" },
    { key: "tags" as const, label: "Tags" },
  ];

  return (
    <aside className={`${
      isMobile ? "w-full" : "w-[260px] shrink-0 border-r"
    } border-border-subtle bg-surface/40 backdrop-blur-md flex flex-col h-full select-none`}>
      {/* ---- header ---- */}
      <div className={`flex items-center justify-between ${isMobile ? "px-5 pt-5 pb-2" : "px-4 pt-4 pb-2"}`}>
        <h2 className={`font-semibold text-text-primary tracking-tight ${isMobile ? "text-base" : "text-sm"}`}>
          Commits
        </h2>
        {!isMobile && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-hover text-text-ghost hover:text-text-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ---- search ---- */}
      <div className={`${isMobile ? "px-5" : "px-3"} pb-3`}>
        <div className={`flex items-center gap-2 px-3 ${isMobile ? "py-2.5" : "py-2"} rounded-xl border border-border-subtle bg-card/40 focus-within:border-border-hover transition-colors`}>
          <Search className="w-3.5 h-3.5 text-text-ghost shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commits..."
            className={`flex-1 bg-transparent ${isMobile ? "text-sm" : "text-xs"} text-text-primary placeholder:text-text-ghost outline-none`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-text-ghost hover:text-text-secondary cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ---- tabs ---- */}
      <div className={`flex items-center gap-0.5 ${isMobile ? "px-5" : "px-3"} pb-3`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md ${isMobile ? "text-sm" : "text-xs"} font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "bg-surface-active text-text-primary"
                : "text-text-ghost hover:text-text-muted hover:bg-surface-hover/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- divider ---- */}
      <div className={`h-px bg-border-subtle ${isMobile ? "mx-5" : "mx-3"}`} />

      {/* ---- commit list ---- */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? "px-3 py-3 space-y-1" : "px-2 py-2 space-y-0.5"} scrollbar-thin`}>
        {loading && commits.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="px-3 py-3 rounded-lg space-y-2 animate-pulse"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-hover" />
                  <div className="h-3 w-32 rounded bg-surface-hover" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-14 rounded bg-surface-hover" />
                  <div className="h-3 w-16 rounded bg-surface-hover" />
                </div>
              </div>
            ))
          : filtered.map((commit) => {
              const isSelected = commit.sha === selectedSha;
              return (
                <button
                  key={commit.sha}
                  onClick={() => onSelectCommit(commit.sha)}
                  className={`w-full text-left ${isMobile ? "px-4 py-4" : "px-3 py-3"} rounded-xl transition-all duration-150 cursor-pointer group ${
                    isSelected
                      ? "bg-surface-active border-l-2 border-[oklch(0.6_0.18_260)]"
                      : "hover:bg-surface-hover/60 border-l-2 border-transparent"
                  }`}
                >
                  {/* top row: avatar + message */}
                  <div className="flex items-start gap-2.5 mb-2">
                    {commit.authorAvatar ? (
                      <img
                        src={commit.authorAvatar}
                        alt={commit.author}
                        className="w-6 h-6 rounded-full ring-1 ring-border-subtle shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-surface-active flex items-center justify-center text-[9px] font-bold text-text-muted shrink-0 mt-0.5">
                        {commit.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p
                      className={`${isMobile ? "text-sm" : "text-xs"} leading-snug line-clamp-2 ${
                        isSelected
                          ? "text-text-primary font-medium"
                          : "text-text-secondary group-hover:text-text-primary"
                      }`}
                    >
                      {commit.message}
                    </p>
                  </div>

                  {/* bottom row: hash + date */}
                  <div className="flex items-center justify-between pl-[34px]">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                        isSelected
                          ? "bg-[oklch(0.25_0.08_260)] text-[oklch(0.7_0.15_260)] border border-[oklch(0.35_0.1_260)]"
                          : "bg-badge-bg text-badge-text border border-badge-border"
                      }`}
                    >
                      {commit.sha.slice(0, 7)}
                    </span>
                    <span className="text-[10px] text-text-ghost">
                      {formatRelativeTime(commit.date)}
                    </span>
                  </div>
                </button>
              );
            })}

        {/* empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-text-ghost">
            <Search className="w-5 h-5 mb-2 opacity-40" />
            <p className="text-xs">No commits found</p>
          </div>
        )}
      </div>

      {/* ---- load more ---- */}
      {hasMore && filtered.length > 0 && !search && (
        <div className="px-3 py-3 border-t border-border-subtle">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-2 rounded-lg border border-border-subtle bg-card/30 hover:bg-surface-hover text-xs text-text-muted hover:text-text-secondary font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load more commits"}
          </button>
        </div>
      )}
    </aside>
  );
}
