import { RepoInfo } from "../types/RepoInfo";
async function fetchRepo(owner: string, repo: string): Promise<RepoInfo> {


  const API = process.env.GITHUB_API_URL
  const res = await fetch(`${API}/repos/${owner}/${repo}`);
  if (!res.ok) throw new Error(`Repo fetch failed: ${res.status},make sure the repo is public`);
  return res.json();
}
export { fetchRepo }
