import ApiResponce from "@/utities/ApiResponce";
import { redis } from "@/lib/reddis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, path, ref, newdata = false } = await req.json();

    if (!owner || !repo || !path || ref === undefined) {
      return NextResponse.json(
        { error: "owner, repo, path, and ref are required" },
        { status: 400 }
      );
    }

    const encodedPath = path
      .split("/")
      .map((s: string) => encodeURIComponent(s))
      .join("/");

    //cache the file content
    if (!newdata) {
      const CacheFileContent = await redis.get(`filecontent/${owner}/${repo}/${encodedPath}/${ref}`);
      if (CacheFileContent) return ApiResponce({ statusCode: 200, data: CacheFileContent, message: "success" });
    }

    const API = process.env.GITHUB_API_URL;
    const url = `${API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: `File fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // decode base64 content (handle UTF-8)
    const raw = atob(data.content.replace(/\n/g, ""));
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);

    const fileContent = {
      content: decoded,
      download_url: data.download_url || "",
    };

    //set the cache
    await redis.set(`filecontent/${owner}/${repo}/${encodedPath}/${ref}`, JSON.stringify(fileContent));

    return ApiResponce({ statusCode: 200, data: fileContent, message: "success" });
  } catch (error) {
    return ApiResponce({ statusCode: 500, data: error, message: "failed" });
  }
}
