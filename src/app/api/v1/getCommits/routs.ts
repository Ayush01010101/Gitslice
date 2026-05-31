import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, page = 1, perPage = 20 } = await req.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
    }

    const API = process.env.GITHUB_API_URL;
    const res = await fetch(
      `${API}/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Commits fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const commits = data.map(
      (c: {
        sha: string;
        commit: {
          message: string;
          author: { name: string; date: string };
        };
        author?: { login: string; avatar_url: string } | null;
      }) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        author: c.author?.login || c.commit.author.name,
        authorAvatar: c.author?.avatar_url,
        date: c.commit.author.date,
      })
    );

    return NextResponse.json(commits);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
