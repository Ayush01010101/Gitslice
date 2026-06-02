"use client";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import RepoInfoBar from "../../components/RepoInfoBar";
import CommitSidebar from "../../components/CommitSidebar";
import { CommitInfo } from "@/lib/types/commit.type";
import { fetchCommits } from "../../functions/fetchCommits";
import FileTree from "../../components/FileTree";
import { type TreeItem } from "@/lib/types/tree.type";
import CodeViewer, { CodeViewerEmpty } from "../../components/CodeViewer";
import { fetchFileContent } from "../../functions/fetchFileContent";
import { useQuery } from "@tanstack/react-query";


type MobileTab = "commits" | "files" | "about";

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

  const [commitPage, setCommitPage] = useState(1);
  const [selectedSha, setSelectedSha] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewedFile, setViewedFile] = useState<ViewedFile | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- mobile tab ---- */
  const [mobileTab, setMobileTab] = useState<MobileTab>("commits");


  const { isPending: CommitsPending, error: Commiterror, data: commits } = useQuery({
    queryKey: [`commits/${owner}/${reponame}/${commitPage}`],
    queryFn: async () => {
      console.log("use query trigger")
      const data = await fetch("/api/v1/getCommits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: owner,
          repo: reponame,
          page: commitPage
        })
      })
      const commits = await data.json()
      return commits;
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  })
  console.log("commits", commits)


  /* ---- handlers ---- */
  // const handleSelectCommit = useCallback((sha: string) => {
  //   setSelectedSha(sha);
  //   setCurrentPath([]); // reset to root
  //   setViewedFile(null);
  // }, []);
  //


  // const handleSelectAll = useCallback(
  //   (selected: boolean) => {
  //     if (selected) {
  //       setSelectedItems(new Set(treeItems.map((i) => i.path)));
  //     } else {
  //       setSelectedItems(new Set());
  //     }
  //   },
  //   [treeItems]
  // );
  //
  // const handleOpenFile = useCallback(
  //   async (item: TreeItem) => {
  //     if (loadingFile) return;
  //     try {
  //       setLoadingFile(true);
  //       const { content, download_url } = await fetchFileContent(
  //         owner,
  //         reponame,
  //         item.path,
  //         selectedSha
  //       );
  //       setViewedFile({
  //         name: item.name,
  //         path: item.path,
  //         content,
  //         rawUrl: download_url,
  //       });
  //     } catch (err) {
  //       console.error("File load error:", err);
  //     } finally {
  //       setLoadingFile(false);
  //     }
  //   },
  //   [owner, reponame, selectedSha, loadingFile]
  // );



  /* ---- build commit info for info bar ---- */


  /* ---- mobile: file open switches to code tab automatically ---- */
  // const handleOpenFileMobile = useCallback(
  //   async (item: TreeItem) => {
  //     await handleOpenFile(item);
  //     // On mobile, viewing a file should show the code viewer
  //     // The viewedFile state change will auto-show via the mobileTab logic below
  //   },
  //   [handleOpenFile]
  // );

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
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* ---- repo info bar ---- */}
      <RepoInfoBar
        owner={owner}
        reponame={reponame}
        description={"something description"}
        loading={false}
      />
    </div>
  )
  {/* ================================================================ */ }
  {/* DESKTOP (lg+) — original 3-panel side-by-side layout             */ }
  {/* ================================================================ */ }
  {/*     <div className="hidden lg:flex flex-1 overflow-hidden"> */ }
  {/*       {/* commit sidebar */ }
}
{/*       {showSidebar && ( */ }
{/*         <CommitSidebar */ }
{/*           commits={commits!} */ }
{/*           selectedSha={selectedSha} */ }
{/*           onSelectCommit={handleSelectCommit} */ }
{/*           onClose={() => setShowSidebar(false)} */ }
{/*           onLoadMore={handleLoadMoreCommits} */ }
{/*           loading={CommitsPending} */ }
{/*         /> */ }
{/*       )} */ }
{/**/ }
{/*       {/* file tree */ }
{/*       <FileTree */ }
{/*         items={treeItems} */ }
{/*         currentPath={currentPath} */ }
{/*         selectedItems={selectedItems} */ }
{/*         onNavigate={handleNavigate} */ }
{/*         onToggleSelect={handleToggleSelect} */ }
{/*         onSelectAll={handleSelectAll} */ }
{/*         onOpenFile={handleOpenFile} */ }
{/*         onDownloadSelected={handleDownloadSelected} */ }
{/*         loading={loadingTree} */ }
{/*       /> */ }
{/**/ }
{/*       {/* code viewer */ }
{/*       {loadingFile ? ( */ }
{/*         <div className="flex-1 flex items-center justify-center bg-background/60"> */ }
{/*           <div className="flex flex-col items-center gap-3 text-text-ghost"> */ }
{/*             <div className="w-6 h-6 border-2 border-text-ghost/30 border-t-text-secondary rounded-full animate-spin" /> */ }
{/*             <span className="text-xs">Loading file...</span> */ }
{/*           </div> */ }
{/*         </div> */ }
{/*       ) : viewedFile ? ( */ }
{/*         <CodeViewer */ }
{/*           filename={viewedFile.name} */ }
{/*           content={viewedFile.content} */ }
{/*           onClose={() => setViewedFile(null)} */ }
{/*           rawUrl={viewedFile.rawUrl} */ }
{/*         /> */ }
{/*       ) : ( */ }
{/*         <CodeViewerEmpty /> */ }
{/*       )} */ }
{/*     </div> */ }
{/**/ }
{/*     {/* ================================================================ */ }
{/*     {/* MOBILE (< lg) — single panel with bottom tabs                    */ }
{/*     {/* ================================================================ */ }
{/*     <div className="flex lg:hidden flex-1 flex-col overflow-hidden"> */ }
{/*       {/* Mobile: viewed file overlay */ }
{/*       {viewedFile && ( */ }
{/*         <div className="flex-1 flex flex-col overflow-hidden"> */ }
{/*           <CodeViewer */ }
{/*             filename={viewedFile.name} */ }
{/*             content={viewedFile.content} */ }
{/*             onClose={() => setViewedFile(null)} */ }
{/*             rawUrl={viewedFile.rawUrl} */ }
{/*           /> */ }
{/*         </div> */ }
{/*       )} */ }
{/**/ }
{/*       {loadingFile && !viewedFile && ( */ }
{/*         <div className="flex-1 flex items-center justify-center bg-background/60"> */ }
{/*           <div className="flex flex-col items-center gap-3 text-text-ghost"> */ }
{/*             <div className="w-6 h-6 border-2 border-text-ghost/30 border-t-text-secondary rounded-full animate-spin" /> */ }
{/*             <span className="text-xs">Loading file...</span> */ }
{/*           </div> */ }
{/*         </div> */ }
{/*       )} */ }
{/**/ }
{/*       {/* Panel content (hidden when file is viewed) */ }
{/*       {!viewedFile && !loadingFile && ( */ }
{/*         <div className="flex-1 overflow-hidden"> */ }
{/*           {mobileTab === "commits" && ( */ }
{/*             <CommitSidebar */ }
{/*               commits={commits} */ }
{/*               selectedSha={selectedSha} */ }
{/*               onSelectCommit={(sha) => { */ }
{/*                 handleSelectCommit(sha); */ }
{/*                 setMobileTab("files"); */ }
{/*               }} */ }
{/*               onClose={() => setMobileTab("files")} */ }
{/*               onLoadMore={handleLoadMoreCommits} */ }
{/*               loading={CommitsPending} */ }
{/*               hasMore={hasMoreCommits} */ }
{/*               isMobile */ }
{/*             /> */ }
{/*           )} */ }
{/**/ }
{/*           {mobileTab === "files" && ( */ }
{/*             <FileTree */ }
{/*               items={treeItems} */ }
{/*               currentPath={currentPath} */ }
{/*               selectedItems={selectedItems} */ }
{/*               onNavigate={handleNavigate} */ }
{/*               onToggleSelect={handleToggleSelect} */ }
{/*               onSelectAll={handleSelectAll} */ }
{/*               onOpenFile={handleOpenFileMobile} */ }
{/*               onDownloadSelected={handleDownloadSelected} */ }
{/*               loading={loadingTree} */ }
{/*               isMobile */ }
{/*             /> */ }
{/*           )} */ }
{/**/ }
{/*           {mobileTab === "about" && ( */ }
{/*             <div className="flex-1 flex flex-col h-full overflow-y-auto bg-surface/30 px-5 py-6"> */ }
{/*               {loadingRepo ? ( */ }
{/*                 <div className="space-y-4 animate-pulse"> */ }
{/*                   <div className="h-5 w-48 rounded bg-surface-hover" /> */ }
{/*                   <div className="h-3 w-full rounded bg-surface-hover" /> */ }
{/*                   <div className="h-3 w-3/4 rounded bg-surface-hover" /> */ }
{/*                 </div> */ }
{/*               ) : repoInfo ? ( */ }
{/*                 <div className="space-y-5"> */ }
{/*                   <div> */ }
{/*                     <h2 className="text-base font-semibold text-text-primary mb-1"> */ }
{/*                       {repoInfo.full_name} */ }
{/*                     </h2> */ }
{/*                     <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-badge-bg text-badge-text border border-badge-border"> */ }
{/*                       {repoInfo.private ? "Private" : "Public"} */ }
{/*                     </span> */ }
{/*                   </div> */ }
{/**/ }
{/*                   {repoInfo.description && ( */ }
{/*                     <p className="text-sm text-text-muted leading-relaxed"> */ }
{/*                       {repoInfo.description} */ }
{/*                     </p> */ }
{/*                   )} */ }
{/**/ }
{/*                   <div className="grid grid-cols-3 gap-3"> */ }
{/*                     <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card/40 border border-border-subtle"> */ }
{/*                       <span className="text-lg font-bold text-text-primary"> */ }
{/*                         {formatNumberShort(repoInfo.stargazers_count)} */ }
{/*                       </span> */ }
{/*                       <span className="text-[10px] text-text-ghost uppercase tracking-wider"> */ }
{/*                         Stars */ }
{/*                       </span> */ }
{/*                     </div> */ }
{/*                     <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card/40 border border-border-subtle"> */ }
{/*                       <span className="text-lg font-bold text-text-primary"> */ }
{/*                         {formatNumberShort(repoInfo.forks_count)} */ }
{/*                       </span> */ }
{/*                       <span className="text-[10px] text-text-ghost uppercase tracking-wider"> */ }
{/*                         Forks */ }
{/*                       </span> */ }
{/*                     </div> */ }
{/*                     <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-card/40 border border-border-subtle"> */ }
{/*                       <span className="text-sm font-bold text-text-primary font-mono"> */ }
{/*                         {repoInfo.default_branch} */ }
{/*                       </span> */ }
{/*                       <span className="text-[10px] text-text-ghost uppercase tracking-wider"> */ }
{/*                         Branch */ }
{/*                       </span> */ }
{/*                     </div> */ }
{/*                   </div> */ }
{/**/ }
{/*                   <a */ }
{/*                     href={repoInfo.html_url} */ }
{/*                     target="_blank" */ }
{/*                     rel="noopener noreferrer" */ }
{/*                     className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card/40 border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors" */ }
{/*                   > */ }
{/*                     <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"> */ }
{/*                       <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /> */ }
{/*                     </svg> */ }
{/*                     View on GitHub */ }
{/*                   </a> */ }
{/**/ }
{/*                   <button */ }
{/*                     onClick={handleDownloadZip} */ }
{/*                     className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[oklch(0.42_0.12_160)] hover:bg-[oklch(0.48_0.14_160)] text-white text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97] shadow-[0_0_20px_oklch(0.35_0.1_160_/_25%)]" */ }
{/*                   > */ }
{/*                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> */ }
{/*                       <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /> */ }
{/*                     </svg> */ }
{/*                     Download ZIP */ }
{/*                   </button> */ }
{/*                 </div> */ }
{/*               ) : null} */ }
{/*             </div> */ }
{/*           )} */ }
{/*         </div> */ }
{/*       )} */ }
{/**/ }
{/*       {/* ---- Bottom Tab Navigation ---- */ }
{/*       <nav className="shrink-0 border-t border-border-subtle bg-surface/80 backdrop-blur-xl safe-bottom"> */ }
{/*         <div className="flex items-center justify-around py-1"> */ }
{/*           {([ */ }
{/*             { key: "commits" as MobileTab, label: "Commits", icon: CommitIcon }, */ }
{/*             { key: "files" as MobileTab, label: "Files", icon: FilesIcon }, */ }
{/*             { key: "about" as MobileTab, label: "About", icon: AboutIcon }, */ }
{/*           ]).map((tab) => { */ }
{/*             const isActive = mobileTab === tab.key && !viewedFile; */ }
{/*             return ( */ }
{/*               <button */ }
{/*                 key={tab.key} */ }
{/*                 onClick={() => { */ }
{/*                   setViewedFile(null); */ }
{/*                   setMobileTab(tab.key); */ }
{/*                 }} */ }
{/*                 className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${isActive */ }
{/*                   ? "text-[oklch(0.7_0.18_260)]" */ }
{/*                   : "text-text-ghost hover:text-text-muted" */ }
{/*                   }`} */ }
{/*               > */ }
{/*                 <tab.icon active={isActive} /> */ }
{/*                 <span className={`text-[10px] font-medium ${isActive ? "text-[oklch(0.7_0.18_260)]" : ""}`}> */ }
{/*                   {tab.label} */ }
{/*                 </span> */ }
{/*               </button> */ }
{/*             ); */ }
{/*           })} */ }
{/*         </div> */ }
{/*       </nav> */ }
{/*     </div> */ }
{/**/ }
{/*     {/* ---- sidebar toggle (shown when sidebar is hidden — desktop only) ---- */ }
{/*     {!showSidebar && ( */ }
{/*       <button */ }
{/*         onClick={() => setShowSidebar(true)} */ }
{/*         className="hidden lg:block fixed bottom-4 left-4 z-50 px-3 py-2 rounded-xl bg-surface border border-border-subtle text-xs text-text-muted hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer shadow-lg backdrop-blur-md" */ }
{/*       > */ }
{/*         Show Commits */ }
{/*       </button> */ }
{/*     )} */ }
{/*   </div> */ }
{/* ); */ }


/* ---- helper ---- */
function formatNumberShort(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

