"use client";
import { useParams } from "next/navigation";
import { useState, useCallback, useReducer } from "react";
import RepoInfoBar from "../../components/RepoInfoBar";
import CommitSidebar from "../../components/CommitSidebar";
import FileTree from "../../components/FileTree";
import { type TreeItem } from "@/lib/types/tree.type";
import { useQuery } from "@tanstack/react-query";
import CodeViewer from "../../components/CodeViewer";


interface filecontentdatatype {
  filename: string;
  content: string;
  language?: string;
  rawUrl?: string;

}

export default function RepoPage() {
  const params = useParams<{ owner: string; reponame: string }>();
  const owner = params.owner;
  const reponame = params.reponame;

  /* ---- state ---- */
  const [selectedSha, setSelectedSha] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(true);
  const [filecontent, setfilecontent] = useState<filecontentdatatype>(
    {
      filename: "",
      content: "",
    }

  )

  /* ---- derived path string ---- */
  const pathString = currentPath.join("/");

  /* ---- fetch contents with TanStack Query ---- */
  const {
    data: contentsData,
    isLoading: contentsLoading,
  } = useQuery({
    queryKey: [`contents/${owner}/${reponame}/${selectedSha}/${pathString}`],
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
    enabled: !!selectedSha,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const treeItems: TreeItem[] = contentsData ?? [];

  /* ---- handlers ---- */
  const handleSelectCommit = useCallback((sha: string) => {
    setSelectedSha(sha);
    setCurrentPath([]);
    setSelectedItems(new Set());
  }, []);

  const handleNavigate = useCallback((path: string[]) => {
    setCurrentPath(path);
  }, []);

  const handleToggleSelect = useCallback((path: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
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

  const handleOpenFile = useCallback(async (item: TreeItem) => {

    if (item.download_url) {
      const filecontentdata = await fetch(item.download_url)
      const filecontent = await filecontentdata.text()
      console.log(filecontent)

      setfilecontent({
        filename: item.name,
        content: filecontent,
      })
    }

    console.log("Open file:", item);
  }, []);

  const handleDownloadSelected = useCallback(() => {
    // TODO: implement download
    console.log("Download selected:", selectedItems);
  }, [selectedItems]);

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
        {showSidebar && (
          <CommitSidebar
            selectedSha={selectedSha}
            Onclick={handleSelectCommit}
            reponame={reponame}
            owner={owner}
            onLoadMore={() => console.log("load more")}
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
          loading={contentsLoading && !!selectedSha}
        />

        {filecontent.content && <CodeViewer
          filename={filecontent.filename}
          content={filecontent.content}
          language={filecontent.language ? filecontent.language : "unknown"}
          onClose={() => console.log("close")}
        />}
      </div>

    </div>

  )
}
