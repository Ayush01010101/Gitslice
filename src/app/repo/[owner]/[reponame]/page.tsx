"use client";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import RepoInfoBar from "../../components/RepoInfoBar";
import CommitSidebar from "../../components/CommitSidebar";
import FileTree from "../../components/FileTree";
import { type TreeItem } from "@/lib/types/tree.type";
import { useQuery } from "@tanstack/react-query";
import CodeViewer from "../../components/CodeViewer";
import { useRepoViewStore } from "../../store/useRepoViewStore";

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

  useEffect(() => {
    setRepository(owner, reponame);
  }, [owner, reponame, setRepository]);

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

  const treeItems: TreeItem[] = contentsData ?? [];

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

        {openFile.content ? (
          <CodeViewer
            filename={openFile.filename}
            content={openFile.content}
            language={openFile.language}
            rawUrl={openFile.rawUrl}
            onClose={closeFile}
          />
        ) : null}
      </div>

    </div>

  )
}
