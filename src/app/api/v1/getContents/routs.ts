import ApiResponce from "@/utities/ApiResponce";
import { redis } from "@/lib/reddis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, path, ref, newdata = false } = await req.json();

    if (!owner || !repo || ref === undefined) {
      return NextResponse.json(
        { error: "owner, repo, and ref are required" },
        { status: 400 }
      );
    }

    const encodedPath = (path || "")
      .split("/")
      .map((s: string) => encodeURIComponent(s))
      .join("/");

    //cache the contents
    if (!newdata) {
      const CacheContents = await redis.get(`contents/${owner}/${repo}/${encodedPath}/${ref}`);
      if (CacheContents) return ApiResponce({ statusCode: 200, data: CacheContents, message: "success" });
    }

    const API = process.env.GITHUB_API_URL;
    const url = `${API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Contents fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      return NextResponse.json([]);
    }

    const contents = data.map(
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

    //set the cache
    await redis.set(`contents/${owner}/${repo}/${encodedPath}/${ref}`, JSON.stringify(contents));

    return ApiResponce({ statusCode: 200, data: contents, message: "success" });
  } catch (error) {
    return ApiResponce({ statusCode: 500, data: error, message: "failed" });
  }
}
