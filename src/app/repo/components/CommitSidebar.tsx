"use client";
import formatRelativeTime from "@/lib/formatRelativeTime";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Commit } from "@/lib/types/commit.type";
import { useQuery } from "@tanstack/react-query";
import { useRepoViewStore } from "../store/useRepoViewStore";

export type { Commit };

const SEARCH_DEBOUNCE_MS = 3000;

interface CommitSidebarProps {
  isMobile?: boolean;
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

function commitMatchesSearch(commit: Commit, query: string) {
  const q = query.toLowerCase();

  return (
    commit.message.toLowerCase().includes(q) ||
    commit.sha.toLowerCase().startsWith(q) ||
    commit.author.toLowerCase().includes(q)
  );
}

export default function CommitSidebar({
  isMobile = false,
}: CommitSidebarProps) {
  const [search, setSearch] = useState("");
  const searchQuery = search.trim();
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const owner = useRepoViewStore((state) => state.owner);
  const reponame = useRepoViewStore((state) => state.reponame);
  const selectedSha = useRepoViewStore((state) => state.selectedSha);
  const selectCommit = useRepoViewStore((state) => state.selectCommit);

  const { isLoading, error, data: commitsData } = useQuery({
    queryKey: ["commits", owner, reponame, "latest"],
    queryFn: async () => {
      const querystring = new URLSearchParams({
        owner,
        repo: reponame,
      }).toString();

      const response = await fetch(`/api/v1/getCommits?${querystring}`);

      if (!response.ok) {
        throw new Error(`Failed to load commits: ${response.status}`);
      }

      const data = await response.json();
      return data;
    },
    enabled: !!owner && !!reponame,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const latestCommits = useMemo(
    () => ((commitsData?.data ?? []) as Commit[]).slice(0, 10),
    [commitsData]
  );
  const latestMatches = useMemo(() => {
    if (!searchQuery) return latestCommits;

    return latestCommits.filter((commit) =>
      commitMatchesSearch(commit, searchQuery)
    );
  }, [latestCommits, searchQuery]);

  const shouldSearchGithub =
    debouncedSearch.length > 0 &&
    debouncedSearch === searchQuery &&
    latestMatches.length === 0;
  const {
    isFetching: isSearchingGithub,
    error: searchError,
    data: searchData,
  } = useQuery({
    queryKey: ["commits", owner, reponame, "search", debouncedSearch],
    queryFn: async () => {
      const querystring = new URLSearchParams({
        owner,
        repo: reponame,
        search: debouncedSearch,
      }).toString();

      const response = await fetch(`/api/v1/getCommits?${querystring}`);

      if (!response.ok) {
        throw new Error(`Failed to search commits: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!owner && !!reponame && shouldSearchGithub,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const searchCommits = ((searchData?.data ?? []) as Commit[]).slice(0, 10);
  const displayedCommits = shouldSearchGithub ? searchCommits : latestMatches;
  const isWaitingForDebounce =
    searchQuery.length > 0 && latestMatches.length === 0 && debouncedSearch !== searchQuery;
  const activeError = error || searchError;

  return (
    <aside className={`${isMobile ? "w-full" : "w-96 shrink-0 border-r"} border-border-subtle bg-surface/40 backdrop-blur-md flex flex-col h-full select-none`}>
      {/* ---- header ---- */}
      <div className={`flex items-center justify-between ${isMobile ? "px-5 pt-5 pb-2" : "px-4 pt-4 pb-2"}`}>
        <h2 className={`font-semibold text-text-primary tracking-tight ${isMobile ? "text-base" : "text-sm"}`}>
          Commits
        </h2>

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

      {/* ---- divider ---- */}
      <div className={`h-px bg-border-subtle ${isMobile ? "mx-5" : "mx-3"}`} />

      {/* ---- commit list ---- */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? "px-3 py-3 space-y-1" : "px-2 py-2 space-y-0.5"} scrollbar-thin`}>
        {(isLoading || isSearchingGithub) && displayedCommits.length === 0 && !isWaitingForDebounce
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
          : displayedCommits.map((commit) => {
            const isSelected = commit.sha === selectedSha;
            return (
              <button
                key={commit.sha}
                onClick={() => selectCommit(commit.sha)}
                className={`w-full text-left ${isMobile ? "px-4 py-4" : "px-3 py-3"} rounded-xl transition-all duration-150 cursor-pointer group`}
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
                    className={`${isMobile ? "text-sm" : "text-xs"} leading-snug line-clamp-2 ${isSelected
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
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isSelected
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

        {isWaitingForDebounce ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-ghost">
            <Search className="w-5 h-5 mb-2 opacity-40" />
            <p className="text-xs">Searching GitHub in 3 seconds...</p>
          </div>
        ) : null}

        {activeError ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-ghost">
            <Search className="w-5 h-5 mb-2 opacity-40" />
            <p className="text-xs">Unable to load commits</p>
          </div>
        ) : null}

        {/* empty state */}
        {!isLoading && !isSearchingGithub && !isWaitingForDebounce && !activeError && displayedCommits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-text-ghost">
            <Search className="w-5 h-5 mb-2 opacity-40" />
            <p className="text-xs">No commits found</p>
          </div>
        )}
      </div>
    </aside>
  );
}
