
"use client";
import { RepoInfoBarProps } from "@/lib/types/repoInfoBar.type";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  GitFork,
} from "lucide-react";


function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString()
}

export default function RepoInfoBar({
  owner,
  reponame,
  description,
  isPrivate = false,
}: RepoInfoBarProps) {

  const { isLoading: loading, data: repodata } = useQuery({
    queryKey: [`repo/${owner}/${reponame}`],
    queryFn: async () => {
      const data = await fetch("/api/v1/getRepo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: owner,
          repo: reponame
        })
      })
      const repo = await data.json()
      return repo
    },
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  /* ---------- loading skeleton ---------- */
  if (loading) {
    return (
      <div className="w-full border-b border-border-subtle bg-surface/60 backdrop-blur-md px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <div className="space-y-3 flex-1">
            <div className="h-5 w-48 max-w-full rounded bg-surface-hover animate-pulse" />
            <div className="h-3 w-72 max-w-full rounded bg-surface-hover animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 w-16 rounded bg-surface-hover animate-pulse" />
              <div className="h-4 w-16 rounded bg-surface-hover animate-pulse" />
              <div className="h-4 w-16 rounded bg-surface-hover animate-pulse" />
            </div>
          </div>
          <div className="hidden h-10 w-40 rounded-xl bg-surface-hover animate-pulse lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-border-subtle bg-surface/60 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-6 py-4  sm:py-5 gap-4 lg:gap-5">
        {/* ---- Left: repo identity ---- */}
        <div className="flex flex-col gap-2.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="min-w-0 max-w-full text-lg sm:text-xl font-semibold tracking-tight truncate">
              <span className="text-text-secondary">{owner}</span>
              <span className="text-text-ghost mx-1.5">/</span>
              <span className="text-foreground">{reponame}</span>
            </h1>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-badge-bg text-badge-text border border-badge-border">
              {isPrivate ? "Private" : "Public"}
            </span>
          </div>

          {description && (
            <p className="text-sm text-text-muted leading-relaxed max-w-md truncate">
              {repodata.data.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-text-faint">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {formatNumber(repodata.data.stargazers_count)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {formatNumber(repodata.data.forks)}
            </span>
            {/* <span className="flex items-center gap-1"> */}
            {/*   <GitBranch className="w-3.5 h-3.5" /> */}
            {/*   {defaultBranch} */}
            {/* </span> */}
          </div>
        </div>

      </div>
    </div>
  );
}
