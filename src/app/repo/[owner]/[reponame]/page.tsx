"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import RepoInfoBar, { type CommitInfo } from "../../components/RepoInfoBar";
import CommitSidebar, { type Commit } from "../../components/CommitSidebar";
import FileTree, { type TreeItem } from "../../components/FileTree";
import CodeViewer, { CodeViewerEmpty } from "../../components/CodeViewer";

/* ================================================================== */
/*  GitHub API helpers                                                 */
/* ================================================================== */

const API = "https://api.github.com";

interface RepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
  private: boolean;
  html_url: string;
}

async function fetchRepo(owner: string, repo: string): Promise<RepoInfo> {
  const res = await fetch(`${API}/repos/${owner}/${repo}`);
  if (!res.ok) throw new Error(`Repo fetch failed: ${res.status}`);
  return res.json();
}

async function fetchCommits(
  owner: string,
  repo: string,
  page = 1,
  perPage = 20
): Promise<Commit[]> {
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`
  );
  if (!res.ok) throw new Error(`Commits fetch failed: ${res.status}`);
  const data = await res.json();
  return data.map(
    (c: {
      sha: string;
      commit: {
        message: string;
        author: { name: string; date: string };
      };
      author?: { login: string; avatar_url: string } | null;
    }) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0], // first line only
      author: c.author?.login || c.commit.author.name,
      authorAvatar: c.author?.avatar_url,
      date: c.commit.author.date,
    })
  );
}

async function fetchContents(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<TreeItem[]> {
  const encodedPath = path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  const url = `${API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Contents fetch failed: ${res.status}`);
  const data = await res.json();

  if (!Array.isArray(data)) return []; // single file – shouldn't happen here

  return data.map(
    (item: {
      name: string;
      type: string;
      path: string;
      size: number;
      sha: string;
      download_url: string | null;
    }) => ({
      name: item.name,
      type: item.type === "dir" ? "dir" : "file",
      path: item.path,
      size: item.size,
      sha: item.sha,
      download_url: item.download_url,
    })
  );
}

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<{ content: string; download_url: string }> {
  const encodedPath = path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  const url = `${API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`File fetch failed: ${res.status}`);
  const data = await res.json();

  // decode base64 content (handle UTF-8)
  const raw = atob(data.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes);

  return { content: decoded, download_url: data.download_url || "" };
}

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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
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

      {/* ---- main 3-panel area ---- */}
      <div className="flex-1 flex overflow-hidden">
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

      {/* ---- sidebar toggle (shown when sidebar is hidden) ---- */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed bottom-4 left-4 z-50 px-3 py-2 rounded-xl bg-surface border border-border-subtle text-xs text-text-muted hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer shadow-lg backdrop-blur-md"
        >
          Show Commits
        </button>
      )}
    </div>
  );
}
