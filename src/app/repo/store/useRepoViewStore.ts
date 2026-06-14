import { create } from "zustand";
import type { TreeItem } from "@/lib/types/tree.type";
import { downloadSelectedFiles } from "../functions/DownloadSelectedFiles";

export interface OpenFileContent {
  filename: string;
  content: string;
  language?: string;
  rawUrl?: string;
}

const emptyOpenFile: OpenFileContent = {
  filename: "",
  content: "",
};

interface RepoViewState {
  owner: string;
  reponame: string;
  selectedSha: string;
  currentPath: string[];
  selectedItems: Set<string>;
  showSidebar: boolean;
  openFile: OpenFileContent;
  pendingFileUrl: string;
  isDownloadingSelected: boolean;
  downloadError: string;
  setRepository: (owner: string, reponame: string) => void;
  selectCommit: (sha: string) => void;
  navigateTo: (path: string[]) => void;
  toggleSelectedItem: (path: string) => void;
  setAllSelectedItems: (items: TreeItem[], selected: boolean) => void;
  toggleSidebar: () => void;
  openFileFromTree: (item: TreeItem) => void;
  setOpenFile: (file: OpenFileContent) => void;
  downloadSelectedItems: (items: TreeItem[]) => Promise<void>;
  closeFile: () => void;
}

export const useRepoViewStore = create<RepoViewState>((set) => ({
  owner: "",
  reponame: "",
  selectedSha: "",
  currentPath: [],
  selectedItems: new Set<string>(),
  showSidebar: true,
  openFile: emptyOpenFile,
  pendingFileUrl: "",
  isDownloadingSelected: false,
  downloadError: "",
  setRepository: (owner, reponame) =>
    set((state) => {
      if (state.owner === owner && state.reponame === reponame) {
        return state;
      }

      return {
        owner,
        reponame,
        selectedSha: "",
        currentPath: [],
        selectedItems: new Set<string>(),
        openFile: emptyOpenFile,
        isDownloadingSelected: false,
        downloadError: "",
      };
    }),
  selectCommit: (sha) =>
    set({
      selectedSha: sha,
      currentPath: [],
      selectedItems: new Set<string>(),
      openFile: emptyOpenFile,
      downloadError: "",
    }),
  navigateTo: (path) =>
    set({
      currentPath: path,
      selectedItems: new Set<string>(),
      openFile: emptyOpenFile,
      downloadError: "",
    }),
  toggleSelectedItem: (path) =>
    set((state) => {
      const selectedItems = new Set(state.selectedItems);

      if (selectedItems.has(path)) {
        selectedItems.delete(path);
      } else {
        selectedItems.add(path);
      }

      return { selectedItems };
    }),
  setAllSelectedItems: (items, selected) =>
    set({
      selectedItems: selected
        ? new Set(items.map((item) => item.path))
        : new Set<string>(),
      downloadError: "",
    }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  openFileFromTree: (item) => {
    if (!item.download_url) return;
    set({ pendingFileUrl: item.download_url, openFile: emptyOpenFile });
  },
  setOpenFile: (file) => set({ openFile: file }),
  downloadSelectedItems: async (items) => {
    const { owner, reponame, selectedSha, selectedItems } =
      useRepoViewStore.getState();
    const itemsToDownload = items.filter((item) => selectedItems.has(item.path));

    if (itemsToDownload.length === 0) {
      return;
    }

    if (!owner || !reponame || !selectedSha) {
      set({ downloadError: "Select a commit before downloading files." });
      return;
    }

    set({ isDownloadingSelected: true, downloadError: "" });

    try {
      await downloadSelectedFiles({
        owner,
        repo: reponame,
        ref: selectedSha,
        items: itemsToDownload,
      });
    } catch (error) {
      set({
        downloadError:
          error instanceof Error
            ? error.message
            : "Failed to download selected files.",
      });
    } finally {
      set({ isDownloadingSelected: false });
    }
  },
  closeFile: () => set({ openFile: emptyOpenFile, pendingFileUrl: "" }),
}));
