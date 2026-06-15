"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RepoInfoBar from "../../components/RepoInfoBar";
import CommitSidebar from "../../components/CommitSidebar";
import FileTree from "../../components/FileTree";
import { type TreeItem } from "@/lib/types/tree.type";
import { useQuery } from "@tanstack/react-query";
import CodeViewer, { CodeViewerEmpty, CodeViewerLoading } from "../../components/CodeViewer";
import { useRepoViewStore } from "../../store/useRepoViewStore";
import { Code2, GitCommit, FolderTree, type LucideIcon } from "lucide-react";

type MobilePanel = "commits" | "files" | "code";

const mobilePanels: Array<{
  key: MobilePanel;
  icon: LucideIcon;
}> = [
    { key: "commits", icon: GitCommit },
    { key: "files", icon: FolderTree },
    { key: "code", icon: Code2 },
  ];

export default function RepoPage() {
  const params = useParams<{ owner: string; reponame: string }>();
  const owner = params.owner;
  const reponame = params.reponame;
  const setRepository = useRepoViewStore((state) => state.setRepository);
  const selectedSha = useRepoViewStore((state) => state.selectedSha);
  const currentPath = useRepoViewStore((state) => state.currentPath);
  const showSidebar = useRepoViewStore((state) => state.showSidebar);
  const openFile = useRepoViewStore((state) => state.openFile);
  const closeFile = useRepoViewStore((state) => state.closeFile);
  const selectedCount = useRepoViewStore((state) => state.selectedItems.size);
  const pendingFileUrl = useRepoViewStore((state) => state.pendingFileUrl);
  const setOpenFile = useRepoViewStore((state) => state.setOpenFile);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("commits");

  useEffect(() => {
    setRepository(owner, reponame);
    setMobilePanel("commits");
  }, [owner, reponame, setRepository]);

  useEffect(() => {
    if (selectedSha && mobilePanel === "commits") {
      setMobilePanel("files");
    }
  }, [mobilePanel, selectedSha]);

  useEffect(() => {
    if (openFile.content) {
      setMobilePanel("code");
    }
  }, [openFile.content]);

  /* ---- derived path string ---- */
  const pathString = currentPath.join("/");

  /* ---- fetch contents with TanStack Query ---- */
  const {
    data: contentsData,
    isLoading: contentsLoading,
  } = useQuery({
    queryKey: ["contents", owner, reponame, selectedSha, pathString],
    queryFn: async () => {
      const querystring = new URLSearchParams({
        owner,
        repo: reponame,
        path: pathString,
        ref: selectedSha,
      }).toString();
      const res = await fetch(`/api/v1/getContents?${querystring}`);
      const json = await res.json();
      return json.data as TreeItem[];
    },
    enabled: !!owner && !!reponame && !!selectedSha,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  /* ---- fetch file content with TanStack Query ---- */
  const pendingFilename = pendingFileUrl
    ? pendingFileUrl.split("/").pop() ?? ""
    : "";
  const { isLoading: fileLoading } = useQuery({
    queryKey: ["fileContent", pendingFileUrl],
    queryFn: async () => {
      const response = await fetch(pendingFileUrl);
      if (!response.ok) throw new Error(`File fetch failed: ${response.status}`);
      const content = await response.text();
      setOpenFile({ filename: pendingFilename, content, rawUrl: pendingFileUrl });
      return content;
    },
    enabled: !!pendingFileUrl,
  });

  const treeItems: TreeItem[] = contentsData ?? [];
  const hasOpenFile = Boolean(openFile.content);
  const handleCloseFile = () => {
    closeFile();
    setMobilePanel("files");
  };

  const renderCodeViewer = () => {
    if (fileLoading) {
      return <CodeViewerLoading filename={pendingFilename} />;
    }
    if (hasOpenFile) {
      return (
        <CodeViewer
          filename={openFile.filename}
          content={openFile.content}
          language={openFile.language}
          rawUrl={openFile.rawUrl}
          onClose={handleCloseFile}
        />
      );
    }
    return <CodeViewerEmpty />;
  };

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* ---- repo info bar ---- */}
      <RepoInfoBar
        owner={owner}
        reponame={reponame}
        description={"something description"}
        loading={false}
      />

      {/* ---- desktop layout ---- */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* commit sidebar */}
        {showSidebar ? <CommitSidebar /> : null}

        {/* file tree */}
        <FileTree
          items={treeItems}
          loading={contentsLoading && !!selectedSha}
        />

        {(hasOpenFile || fileLoading) ? renderCodeViewer() : <CodeViewerEmpty />}
      </div>

      {/* ---- mobile layout ---- */}
      <div className="lg:hidden flex flex-1 min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,oklch(0.22_0.08_260_/_35%),transparent_38%),linear-gradient(180deg,transparent,oklch(0.08_0.02_260_/_55%))]">
        <nav className="shrink-0 border-b border-border-subtle bg-background/80 px-3 py-2 backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border-subtle bg-surface/35 p-1 shadow-[inset_0_1px_0_oklch(1_0_0_/_5%)]">
            {mobilePanels.map((panel) => {
              const Icon = panel.icon;
              const isActive = mobilePanel === panel.key;
              const badge = panel.key === "files" && selectedCount > 0 ? selectedCount : null;

              return (
                <button
                  key={panel.key}
                  onClick={() => setMobilePanel(panel.key)}
                  className={`relative flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${isActive
                    ? "bg-[oklch(0.55_0.18_260)] text-white shadow-[0_10px_30px_oklch(0.32_0.16_260_/_32%)]"
                    : "text-text-ghost hover:bg-surface-hover/70 hover:text-text-secondary"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {badge ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-[oklch(0.72_0.18_145)] px-1 text-[10px] font-bold text-black">
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 min-h-0 overflow-hidden px-3 pb-3 pt-3">
          <section className={`${mobilePanel === "commits" ? "flex" : "hidden"} h-full overflow-hidden rounded-3xl border border-border-subtle bg-background/70 shadow-[0_18px_60px_oklch(0_0_0_/_28%)] backdrop-blur-md`}>
            <CommitSidebar isMobile />
          </section>

          <section className={`${mobilePanel === "files" ? "flex" : "hidden"} h-full overflow-hidden rounded-3xl border border-border-subtle bg-background/70 shadow-[0_18px_60px_oklch(0_0_0_/_28%)] backdrop-blur-md`}>
            <FileTree
              items={treeItems}
              loading={contentsLoading && !!selectedSha}
              isMobile
            />
          </section>

          <section className={`${mobilePanel === "code" ? "flex" : "hidden"} h-full overflow-hidden rounded-3xl border border-border-subtle bg-background/70 shadow-[0_18px_60px_oklch(0_0_0_/_28%)] backdrop-blur-md`}>
            {renderCodeViewer()}
          </section>
        </main>
      </div>

    </div>

  )
}
