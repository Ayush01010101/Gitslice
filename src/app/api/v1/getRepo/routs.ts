import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { owner, repo } = await req.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
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
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
