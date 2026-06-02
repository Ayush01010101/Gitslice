import ApiResponce from "@/utities/ApiResponce";
import { redis } from "@/lib/reddis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, newdata = false } = await req.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
    }

    //cache the repo data
    if (!newdata) {
      const CacheRepo = await redis.get(`repo/${owner}/${repo}`);
      if (CacheRepo) return ApiResponce({ statusCode: 200, data: CacheRepo, message: "success" });
    }

    const API = process.env.GITHUB_API_URL;
    const res = await fetch(`${API}/repos/${owner}/${repo}`);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Repo fetch failed: ${res.status}, make sure the repo is public` },
        { status: res.status }
      );
    }

    const data = await res.json();

    //set the cache
    await redis.set(`repo/${owner}/${repo}`, JSON.stringify(data));

    return ApiResponce({ statusCode: 200, data: data, message: "success" });
  } catch (error) {
    return ApiResponce({ statusCode: 500, data: error, message: "failed" });
  }
}
