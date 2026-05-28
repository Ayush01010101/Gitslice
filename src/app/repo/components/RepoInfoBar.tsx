"use client";

import {
  Star,
  GitFork,
  GitBranch,
  Download,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
}

interface RepoInfoBarProps {
  owner: string;
  reponame: string;
  description?: string;
  stars?: number;
  forks?: number;
  defaultBranch?: string;
  isPrivate?: boolean;
  currentCommit?: CommitInfo;
  onDownloadZip?: () => void;
  loading?: boolean;
}

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
  currentCommit,
  onDownloadZip,
  loading = false,
}: RepoInfoBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    if (currentCommit?.sha) {
      navigator.clipboard.writeText(currentCommit.sha);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <div className="w-full border-b border-border-subtle bg-surface/60 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between px-6 py-5 gap-5">
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

        {/* ---- Middle: current commit ---- */}
        {currentCommit && (
          <div className="flex flex-col gap-2 px-5 py-3 rounded-xl border border-border-subtle bg-card/40 min-w-0 max-w-md">
            <span className="text-[10px] uppercase tracking-widest text-text-ghost font-semibold">
              Current Commit
            </span>

            <div className="flex items-center gap-3">
              {/* hash badge */}
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-badge-bg border border-badge-border text-xs font-mono text-badge-text hover:border-border-hover hover:text-text-secondary transition-colors cursor-pointer"
              >
                {currentCommit.sha.slice(0, 7)}
                {copied ? (
                  <Check className="w-3 h-3 text-[oklch(0.65_0.15_150)]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>

              {/* divider */}
              <div className="w-px h-5 bg-border-subtle" />

              {/* author */}
              <div className="flex items-center gap-2">
                {currentCommit.authorAvatar ? (
                  <img
                    src={currentCommit.authorAvatar}
                    alt={currentCommit.author}
                    className="w-5 h-5 rounded-full ring-1 ring-border-subtle"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-surface-active flex items-center justify-center text-[9px] font-bold text-text-muted">
                    {currentCommit.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-text-secondary font-medium truncate max-w-[120px]">
                  {currentCommit.author}
                </span>
              </div>

              {/* divider */}
              <div className="w-px h-5 bg-border-subtle hidden sm:block" />

              {/* date */}
              <span className="text-xs text-text-ghost hidden sm:block whitespace-nowrap">
                {formatRelativeTime(currentCommit.date)}
              </span>
            </div>

            <p className="text-xs text-text-muted truncate">
              {currentCommit.message}
            </p>
          </div>
        )}

        {/* ---- Right: download button ---- */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[oklch(0.42_0.12_160)] hover:bg-[oklch(0.48_0.14_160)] text-white text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97] shadow-[0_0_20px_oklch(0.35_0.1_160_/_25%)]"
          >
            <Download className="w-4 h-4" />
            Download ZIP
          </button>
          <button className="ml-1 p-2.5 rounded-xl bg-[oklch(0.42_0.12_160)] hover:bg-[oklch(0.48_0.14_160)] text-white transition-all duration-200 cursor-pointer">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
