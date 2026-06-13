import ApiResponce from "@/utities/ApiResponce";
import { redis } from "@/lib/reddis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path") || "";
  const ref = searchParams.get("ref") || "";
  console.log("request trigger in content")

  try {
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
    }

    const encodedPath = path
      .split("/")
      .map((s: string) => encodeURIComponent(s))
      .join("/");

    // check cache
    const cacheKey = `contents/${owner}/${repo}/${encodedPath}/${ref}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return ApiResponce({ statusCode: 200, data: cached, message: "success" });
    }

    const API = process.env.GITHUB_API_URL;
    const url = `${API}/repos/${owner}/${repo}/contents/${encodedPath}${ref ? `?ref=${ref}` : ""}`;

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

    // set cache
    await redis.set(cacheKey, JSON.stringify(contents));

    return ApiResponce({ statusCode: 200, data: contents, message: "success" });
  } catch (error) {
    return ApiResponce({ statusCode: 500, data: error, message: "failed" });
  }
}
