export interface TreeItem {
  name: string;
  type: "file" | "dir";
  path: string;
  size?: number;
  sha: string;
  download_url?: string | null;
}
