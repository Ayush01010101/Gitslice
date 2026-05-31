import { TreeItem } from "@/lib/types/tree.type";
export async function fetchContents(

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
