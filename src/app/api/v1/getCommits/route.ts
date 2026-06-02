import ApiResponce from "@/utities/ApiResponce";
import { redis } from "@/lib/reddis";
import { NextRequest, NextResponse } from "next/server";

interface bodytype {
  owner: string,
  repo: string,
  newdata?: boolean,
  page?: number,
  perPage?: number

}

export async function POST(req: NextRequest) {

  try {
    const { owner, repo, newdata = false, page = 1, perPage = 10 }: bodytype = await req.json();


    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
    }
    const API = process.env.GITHUB_API_URL;

    //cache the latest commit 
    if (!newdata) {

      const CacheCommits = await redis.get(`commits/${owner}/${repo}/${page}`);
      if (CacheCommits) return ApiResponce({ statusCode: 200, data: CacheCommits, message: "success" })

    }

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

    //set the cache 
    await redis.set(`commits/${owner}/${repo}/${page}`, JSON.stringify(commits));

    return ApiResponce({ statusCode: 200, data: commits, message: "success" })
  } catch (error) {
    return ApiResponce({ statusCode: 500, data: error, message: "failed" })

  }
}
