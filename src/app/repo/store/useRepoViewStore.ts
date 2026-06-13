import { create } from "zustand";
import { TreeItem } from "@/lib/types/tree.type";

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
  setRepository: (owner: string, reponame: string) => void;
  selectCommit: (sha: string) => void;
  navigateTo: (path: string[]) => void;
  toggleSelectedItem: (path: string) => void;
  setAllSelectedItems: (items: TreeItem[], selected: boolean) => void;
  toggleSidebar: () => void;
  openFileFromTree: (item: TreeItem) => Promise<void>;
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
      };
    }),
  selectCommit: (sha) =>
    set({
      selectedSha: sha,
      currentPath: [],
      selectedItems: new Set<string>(),
      openFile: emptyOpenFile,
    }),
  navigateTo: (path) =>
    set({
      currentPath: path,
      selectedItems: new Set<string>(),
      openFile: emptyOpenFile,
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
  setAllSelectedItems: (items, selected) => ({
    selectedItems: selected
      ? new Set(items.map((item) => item.path))
      : new Set<string>(),
  }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  openFileFromTree: async (item) => {
    if (!item.download_url) {
      return;
    }

    const response = await fetch(item.download_url);
    const content = await response.text();

    set({
      openFile: {
        filename: item.name,
        content,
        rawUrl: item.download_url,
      },
    });
  },
  closeFile: () => set({ openFile: emptyOpenFile }),
}));
