
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<{ content: string; download_url: string }> {
  const encodedPath = path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  const API = process.env.GITHUB_API_URL
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
