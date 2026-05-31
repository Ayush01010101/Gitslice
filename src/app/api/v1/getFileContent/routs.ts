import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, path, ref } = await req.json();

    if (!owner || !repo || !path || ref === undefined) {
      return NextResponse.json(
        { error: "owner, repo, path, and ref are required" },
        { status: 400 }
      );
    }

    const API = process.env.GITHUB_API_URL;
    const encodedPath = path
      .split("/")
      .map((s: string) => encodeURIComponent(s))
      .join("/");
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

    return NextResponse.json({
      content: decoded,
      download_url: data.download_url || "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
