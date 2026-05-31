"use client";
import { RepoInfo } from "../../types/RepoInfo";
import { useParams } from "next/navigation";
import { fetchRepo } from "../../functions/fetchRepo";
import { useState, useEffect, useCallback } from "react";
import RepoInfoBar from "../../components/RepoInfoBar";
import CommitSidebar, { type Commit } from "../../components/CommitSidebar";
import { CommitInfo } from "../../types/CommitInfo";
import { fetchCommits } from "../../functions/fetchCommits";
import FileTree, { type TreeItem } from "../../components/FileTree";
import { fetchContents } from "../../functions/fetchContents";
import CodeViewer, { CodeViewerEmpty } from "../../components/CodeViewer";
import { fetchFileContent } from "../../functions/fetchFileContent";


/* ================================================================== */
/*  Mobile tab type                                                    */
/* ================================================================== */

type MobileTab = "commits" | "files" | "about";

/* ================================================================== */
/*  Page component                                                     */
/* ================================================================== */

interface ViewedFile {
  name: string;
  path: string;
  content: string;
  rawUrl: string;
}

export default function RepoPage() {
  const params = useParams<{ owner: string; reponame: string }>();
  const owner = params.owner;
  const reponame = params.reponame;

  /* ---- state ---- */
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [commitPage, setCommitPage] = useState(1);
  const [hasMoreCommits, setHasMoreCommits] = useState(true);
  const [selectedSha, setSelectedSha] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewedFile, setViewedFile] = useState<ViewedFile | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingRepo, setLoadingRepo] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- mobile tab ---- */
  const [mobileTab, setMobileTab] = useState<MobileTab>("commits");

  /* ---- initial data ---- */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoadingRepo(true);
        setLoadingCommits(true);
        setError(null);

        const [repo, firstCommits] = await Promise.all([
          fetchRepo(owner, reponame),
          fetchCommits(owner, reponame, 1),
        ]);

        if (cancelled) return;

        setRepoInfo(repo);
        setCommits(firstCommits);
        setHasMoreCommits(firstCommits.length >= 20);
        setLoadingRepo(false);
        setLoadingCommits(false);

        if (firstCommits.length > 0) {
          setSelectedSha(firstCommits[0].sha);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load repository"
        );
        setLoadingRepo(false);
        setLoadingCommits(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [owner, reponame]);

  /* ---- fetch tree when commit or path changes ---- */
  useEffect(() => {
    if (!selectedSha) return;
    let cancelled = false;

    async function loadTree() {
      try {
        setLoadingTree(true);
        const path = currentPath.join("/");
        const items = await fetchContents(owner, reponame, path, selectedSha);
        if (cancelled) return;
        setTreeItems(items);
        setSelectedItems(new Set()); // reset selection on nav
      } catch (err) {
        if (cancelled) return;
        console.error("Tree load error:", err);
        setTreeItems([]);
      } finally {
        if (!cancelled) setLoadingTree(false);
      }
    }

    loadTree();
    return () => {
      cancelled = true;
    };
  }, [owner, reponame, selectedSha, currentPath]);

  /* ---- handlers ---- */
  const handleSelectCommit = useCallback((sha: string) => {
    setSelectedSha(sha);
    setCurrentPath([]); // reset to root
    setViewedFile(null);
  }, []);

  const handleLoadMoreCommits = useCallback(async () => {
    try {
      setLoadingCommits(true);
      const nextPage = commitPage + 1;
      const more = await fetchCommits(owner, reponame, nextPage);
      setCommits((prev) => [...prev, ...more]);
      setCommitPage(nextPage);
      setHasMoreCommits(more.length >= 20);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingCommits(false);
    }
  }, [owner, reponame, commitPage]);

  const handleNavigate = useCallback((path: string[]) => {
    setCurrentPath(path);
    setSelectedItems(new Set());
  }, []);

  const handleToggleSelect = useCallback((path: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedItems(new Set(treeItems.map((i) => i.path)));
      } else {
        setSelectedItems(new Set());
      }
    },
    [treeItems]
  );

  const handleOpenFile = useCallback(
    async (item: TreeItem) => {
      if (loadingFile) return;
      try {
        setLoadingFile(true);
        const { content, download_url } = await fetchFileContent(
          owner,
          reponame,
          item.path,
          selectedSha
        );
        setViewedFile({
          name: item.name,
          path: item.path,
          content,
          rawUrl: download_url,
        });
      } catch (err) {
        console.error("File load error:", err);
      } finally {
        setLoadingFile(false);
      }
    },
    [owner, reponame, selectedSha, loadingFile]
  );

  const handleDownloadZip = useCallback(() => {
    if (!repoInfo) return;
    window.open(
      `https://github.com/${owner}/${reponame}/archive/${selectedSha || repoInfo.default_branch}.zip`,
      "_blank"
    );
  }, [owner, reponame, selectedSha, repoInfo]);

  const handleDownloadSelected = useCallback(() => {
    // Download each selected file individually (for now)
    treeItems.forEach((item) => {
      if (selectedItems.has(item.path) && item.download_url) {
        window.open(item.download_url, "_blank");
      }
    });
  }, [treeItems, selectedItems]);

  /* ---- build commit info for info bar ---- */
  const currentCommit: CommitInfo | undefined = commits.find(
    (c) => c.sha === selectedSha
  );

  /* ---- mobile: file open switches to code tab automatically ---- */
  const handleOpenFileMobile = useCallback(
    async (item: TreeItem) => {
      await handleOpenFile(item);
      // On mobile, viewing a file should show the code viewer
      // The viewedFile state change will auto-show via the mobileTab logic below
    },
    [handleOpenFile]
  );

  /* ---- error state ---- */
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[oklch(0.2_0.08_20)] flex items-center justify-center">
            <span className="text-xl">⚠</span>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            Failed to load repository
          </h2>
          <p className="text-sm text-text-muted max-w-md">{error}</p>
          <p className="text-xs text-text-ghost">
            This may be due to GitHub API rate limiting (60 requests/hour for
            unauthenticated users)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* ---- repo info bar ---- */}
      <RepoInfoBar
        owner={owner}
        reponame={reponame}
        description={repoInfo?.description || undefined}
        stars={repoInfo?.stargazers_count}
        forks={repoInfo?.forks_count}
        defaultBranch={repoInfo?.default_branch}
        isPrivate={repoInfo?.private}
        currentCommit={currentCommit}
        onDownloadZip={handleDownloadZip}
        loading={loadingRepo}
      />

      {/* ================================================================ */}
      {/* DESKTOP (lg+) — original 3-panel side-by-side layout             */}
      {/* ================================================================ */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* commit sidebar */}
        {showSidebar && (
          <CommitSidebar
            commits={commits}
            selectedSha={selectedSha}
            onSelectCommit={handleSelectCommit}
            onClose={() => setShowSidebar(false)}
            onLoadMore={handleLoadMoreCommits}
            loading={loadingCommits}
            hasMore={hasMoreCommits}
          />
        )}

        {/* file tree */}
        <FileTree
          items={treeItems}
          currentPath={currentPath}
          selectedItems={selectedItems}
          onNavigate={handleNavigate}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onOpenFile={handleOpenFile}
          onDownloadSelected={handleDownloadSelected}
          loading={loadingTree}
        />

        {/* code viewer */}
        {loadingFile ? (
          <div className="flex-1 flex items-center justify-center bg-background/60">
            <div className="flex flex-col items-center gap-3 text-text-ghost">
              <div className="w-6 h-6 border-2 border-text-ghost/30 border-t-text-secondary rounded-full animate-spin" />
              <span className="text-xs">Loading file...</span>
            </div>
          </div>
        ) : viewedFile ? (
          <CodeViewer
            filename={viewedFile.name}
            content={viewedFile.content}
            onClose={() => setViewedFile(null)}
            rawUrl={viewedFile.rawUrl}
          />
        ) : (
          <CodeViewerEmpty />
        )}
      </div>

      {/* ================================================================ */}
      {/* MOBILE (< lg) — single panel with bottom tabs                    */}
      {/* ================================================================ */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
        {/* Mobile: viewed file overlay */}
        {viewedFile && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <CodeViewer
              filename={viewedFile.name}
              content={viewedFile.content}
              onClose={() => setViewedFile(null)}
              rawUrl={viewedFile.rawUrl}
            />
          </div>
        )}

        {loadingFile && !viewedFile && (
          <div className="flex-1 flex items-center justify-center bg-background/60">
            <div className="flex flex-col items-center gap-3 text-text-ghost">
              <div className="w-6 h-6 border-2 border-text-ghost/30 border-t-text-secondary rounded-full animate-spin" />
              <span className="text-xs">Loading file...</span>
            </div>
          </div>
        )}

        {/* Panel content (hidden when file is viewed) */}
        {!viewedFile && !loadingFile && (
          <div className="flex-1 overflow-hidden">
            {mobileTab === "commits" && (
              <CommitSidebar
                commits={commits}
                selectedSha={selectedSha}
                onSelectCommit={(sha) => {
                  handleSelectCommit(sha);
                  setMobileTab("files");
                }}
                onClose={() => setMobileTab("files")}
                onLoadMore={handleLoadMoreCommits}
                loading={loadingCommits}
                hasMore={hasMoreCommits}
                isMobile
              />
            )}

            {mobileTab === "files" && (
              <FileTree
                items={treeItems}
                currentPath={currentPath}
                selectedItems={selectedItems}
                onNavigate={handleNavigate}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onOpenFile={handleOpenFileMobile}
                onDownloadSelected={handleDownloadSelected}
                loading={loadingTree}
                isMobile
              />
            )}

            {mobileTab === "about" && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto bg-surface/30 px-5 py-6">
                {loadingRepo ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-5 w-48 rounded bg-surface-hover" />
                    <div className="h-3 w-full rounded bg-surface-hover" />
                    <div className="h-3 w-3/4 rounded bg-surface-hover" />
                  </div>
                ) : repoInfo ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary mb-1">
                        {repoInfo.full_name}
                      </h2>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-badge-bg text-badge-text border border-badge-border">
                        {repoInfo.private ? "Private" : "Public"}
                      </span>
                    </div>

                    {repoInfo.description && (
                      <p className="text-sm text-text-muted leading-relaxed">
                        {repoInfo.description}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card/40 border border-border-subtle">
                        <span className="text-lg font-bold text-text-primary">
                          {formatNumberShort(repoInfo.stargazers_count)}
                        </span>
                        <span className="text-[10px] text-text-ghost uppercase tracking-wider">
                          Stars
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card/40 border border-border-subtle">
                        <span className="text-lg font-bold text-text-primary">
                          {formatNumberShort(repoInfo.forks_count)}
                        </span>
                        <span className="text-[10px] text-text-ghost uppercase tracking-wider">
                          Forks
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card/40 border border-border-subtle">
                        <span className="text-sm font-bold text-text-primary font-mono">
                          {repoInfo.default_branch}
                        </span>
                        <span className="text-[10px] text-text-ghost uppercase tracking-wider">
                          Branch
                        </span>
                      </div>
                    </div>

                    <a
                      href={repoInfo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card/40 border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                      View on GitHub
                    </a>

                    <button
                      onClick={handleDownloadZip}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[oklch(0.42_0.12_160)] hover:bg-[oklch(0.48_0.14_160)] text-white text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97] shadow-[0_0_20px_oklch(0.35_0.1_160_/_25%)]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download ZIP
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ---- Bottom Tab Navigation ---- */}
        <nav className="shrink-0 border-t border-border-subtle bg-surface/80 backdrop-blur-xl safe-bottom">
          <div className="flex items-center justify-around py-1">
            {([
              { key: "commits" as MobileTab, label: "Commits", icon: CommitIcon },
              { key: "files" as MobileTab, label: "Files", icon: FilesIcon },
              { key: "about" as MobileTab, label: "About", icon: AboutIcon },
            ]).map((tab) => {
              const isActive = mobileTab === tab.key && !viewedFile;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setViewedFile(null);
                    setMobileTab(tab.key);
                  }}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${isActive
                    ? "text-[oklch(0.7_0.18_260)]"
                    : "text-text-ghost hover:text-text-muted"
                    }`}
                >
                  <tab.icon active={isActive} />
                  <span className={`text-[10px] font-medium ${isActive ? "text-[oklch(0.7_0.18_260)]" : ""}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ---- sidebar toggle (shown when sidebar is hidden — desktop only) ---- */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="hidden lg:block fixed bottom-4 left-4 z-50 px-3 py-2 rounded-xl bg-surface border border-border-subtle text-xs text-text-muted hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer shadow-lg backdrop-blur-md"
        >
          Show Commits
        </button>
      )}
    </div>
  );
}

/* ---- helper ---- */
function formatNumberShort(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

/* ---- Bottom tab icons ---- */
function CommitIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-[oklch(0.7_0.18_260)]" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="21" />
    </svg>
  );
}

function FilesIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-[oklch(0.7_0.18_260)]" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function AboutIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-[oklch(0.7_0.18_260)]" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
