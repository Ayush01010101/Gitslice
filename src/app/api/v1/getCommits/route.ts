import ApiResponce from "@/utities/ApiResponce";
import { redis } from "@/lib/reddis";
import { NextRequest, NextResponse } from "next/server";
import type { Commit } from "@/lib/types/commit.type";

interface GitHubCommitItem {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author?: { login: string; avatar_url: string } | null;
}

function mapCommit(c: GitHubCommitItem): Commit {
  return {
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    author: c.author?.login || c.commit.author.name,
    authorAvatar: c.author?.avatar_url,
    date: c.commit.author.date,
  };
}

function readCachedCommits(cached: unknown): Commit[] | null {
  if (!cached) return null;
  if (Array.isArray(cached)) return cached as Commit[];
  if (typeof cached !== "string") return null;

  try {
    return JSON.parse(cached) as Commit[];
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const search = searchParams.get("search")?.trim() || "";

  try {
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
    }

    const API = process.env.GITHUB_API_URL;
    const cacheKey = search
      ? `commits/search/${owner}/${repo}/${search.toLowerCase()}`
      : `commits/latest/${owner}/${repo}`;
    const cached = readCachedCommits(await redis.get(cacheKey));

    if (cached) {
      return ApiResponce({ statusCode: 200, data: cached, message: "success" });
    }

    const url = search
      ? `${API}/search/commits?q=${encodeURIComponent(`${search} repo:${owner}/${repo}`)}&per_page=10`
      : `${API}/repos/${owner}/${repo}/commits?per_page=10&page=1`;
    const res = await fetch(url, {
      headers: search
        ? {
            Accept: "application/vnd.github.cloak-preview+json",
          }
        : undefined,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Commits fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawCommits = ((search ? data.items : data) ?? []) as GitHubCommitItem[];
    const commits = rawCommits.slice(0, 10).map(mapCommit);

    await redis.set(cacheKey, JSON.stringify(commits));

    return ApiResponce({ statusCode: 200, data: commits, message: "success" });
  } catch (error) {
    return ApiResponce({ statusCode: 500, data: error, message: "failed" });
  }
}
