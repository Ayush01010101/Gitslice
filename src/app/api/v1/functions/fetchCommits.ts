import { Commit } from "@/app/repo/components/CommitSidebar";
export async function fetchCommits(
  owner: string,
  repo: string,
  page = 1,
  perPage = 20
): Promise<Commit[]> {
  console.log(process.env)
  const API = process.env.GITHUB_API_URL
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`
  );
  if (!res.ok) throw new Error(`Commits fetch failed: ${res.status}`);
  const data = await res.json();
  return data.map(
    (c: {
      sha: string;
      commit: {
        message: string;
        author: { name: string; date: string };
      };
      author?: { login: string; avatar_url: string } | null;
    }) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0], // first line only
      author: c.author?.login || c.commit.author.name,
      authorAvatar: c.author?.avatar_url,
      date: c.commit.author.date,
    })
  );
}


