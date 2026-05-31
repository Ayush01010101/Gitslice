
"use client";
import { RepoInfoBarProps } from "../types/RepoInfoBarProps";
import { Button } from "@/components/ui/button";
import {
  Star,
  GitFork,
  GitBranch,
  Download,
} from "lucide-react";


function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
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
  if (diffHour < 24)
    return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "1 Day ago";
  if (diffDay < 7) return `${diffDay} Days ago`;
  if (diffWeek === 1) return "1 week ago";
  if (diffWeek < 5) return `${diffWeek} weeks ago`;
  if (diffMonth === 1) return "1 month ago";
  return `${diffMonth} months ago`;
}

/* ------------------------------------------------------------------ */

export default function RepoInfoBar({
  owner,
  reponame,
  description,
  stars = 0,
  forks = 0,
  defaultBranch = "main",
  isPrivate = false,
  loading = false,
}: RepoInfoBarProps) {


  /* ---------- loading skeleton ---------- */
  if (loading) {
    return (
      <div className="w-full border-b border-border-subtle bg-surface/60 backdrop-blur-md px-6 py-5">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="h-5 w-48 rounded bg-surface-hover animate-pulse" />
            <div className="h-3 w-72 rounded bg-surface-hover animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 w-16 rounded bg-surface-hover animate-pulse" />
              <div className="h-4 w-16 rounded bg-surface-hover animate-pulse" />
              <div className="h-4 w-16 rounded bg-surface-hover animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-40 rounded-xl bg-surface-hover animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full check border-b border-border-subtle bg-surface/60 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between px-4 sm:px-6 py-4 sm:py-5 gap-4 lg:gap-5">
        {/* ---- Left: repo identity ---- */}
        <div className="flex flex-col gap-2.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight truncate">
              <span className="text-text-secondary">{owner}</span>
              <span className="text-text-ghost mx-1.5">/</span>
              <span className="text-foreground">{reponame}</span>
            </h1>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-badge-bg text-badge-text border border-badge-border">
              {isPrivate ? "Private" : "Public"}
            </span>
          </div>

          {description && (
            <p className="text-xs text-text-muted leading-relaxed max-w-md truncate">
              {description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-text-faint">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {formatNumber(stars)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {formatNumber(forks)}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              {defaultBranch}
            </span>
          </div>
        </div>

        {/* ---- Right: download button (desktop only) ---- */}
        <div className="hidden lg:flex items-center shrink-0">
          <Button >

            <Download />
            Download Zip
          </Button>

        </div>
      </div>
    </div>
  );
}
