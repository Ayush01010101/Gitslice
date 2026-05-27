"use client";

import { Spotlight } from "@/components/ui/spotlight-new";
import { GithubSearchInput } from "./components/Githubinput";
import { GitBranchMinus } from "lucide-react";

export default function GitHubStatsHome() {
  return (
    <div className="min-h-screen w-full bg-[#0b0b0d] text-zinc-200 font-sans relative overflow-hidden flex flex-col justify-between selection:bg-zinc-200 selection:text-black">


      <Spotlight height={2000} />
      <div className="relative z-10 w-full flex-grow flex flex-col">

        {/* Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/20 backdrop-blur-md">
            <GitBranchMinus className="w-4 h-4 text-zinc-300" />
            <span className="text-xs font-semibold tracking-tight opacity-70 text-white cursor-pointer" onClick={() => { window.open("https://github.com/Ayush01010101/Gitslice") }}>GitSlice</span>
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[9px] font-bold text-zinc-400 border border-zinc-700">beta</span>
          </div>

          <span className="hidden md:inline text-xs text-zinc-500 font-mono tracking-wider">
            Fast profile snapshots
          </span>
        </header>

        {/* Main Landing Area */}
        <main className="w-full max-w-7xl mx-auto px-6 flex-grow flex flex-col justify-center">

          <div className="w-full flex flex-col items-center py-10 md:py-20 relative">


            {/* Title Section with Metallic Chrome Gradients */}
            <div className="text-center max-w-3xl z-10 mb-12">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-center leading-[1.2] mb-6">
                <span className="bg-clip-text text-transparent bg-linear-to-b opacity-70 from-white via-zinc-100 to-zinc-400">
                  See your
                </span>{" "}
                <span className="relative inline-flex items-center justify-center px-5 py-1 mx-1.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.01)]">
                  {/* Subtle technical bracket/corner ticks */}
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-550"></span>
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-550"></span>
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-550"></span>
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-550"></span>
                  <span className="relative bg-clip-text text-transparent bg-linear-to-b from-white to-zinc-350 font-semibold font-mono tracking-tight">
                    GitHub
                  </span>
                </span>{" "}
                <span className="bg-clip-text text-transparent bg-linear-to-b opacity-70 from-white via-zinc-100 to-zinc-400">
                  clearly
                  <br />
                  in one clean view
                </span>
              </h1>

              <p className="text-sm md:text-base text-zinc-450 max-w-xl mx-auto opacity-70 leading-relaxed mt-4">
                Search any username and get a sharp summary: repos, stars, top languages, and activity.
              </p>
            </div>

            {/* Search Input component (uses shadcn input inside) */}
            <div className="w-full max-w-2xl px-4 z-10">
              <GithubSearchInput
                placeholder="Github Username"
                onSubmit={(val) => {
                  console.log("Searching user:", val);
                }}
              />
            </div>

            {/* Chips below search */}
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3 z-10 max-w-lg px-4">
              {[
                { label: "Linus Torvalds", user: "torvalds" },
                { label: "Tesla Zhang", user: "teslazhang" },
                { label: "Daichi Furiya", user: "daichi" },
                { label: "Sourav", user: "sourav" }
              ].map((chip) => (
                <button
                  key={chip.user}
                  onClick={() => {
                    console.log("Clicked chip:", chip.user);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/10 hover:border-zinc-700 hover:bg-zinc-900/30 text-xs text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  {chip.label === "Sourav" && (
                    <span className="text-[10px] text-zinc-400 font-mono mr-0.5">風</span>
                  )}
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

          </div>

        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center border-t border-zinc-900/30">
        <p className="text-xs text-zinc-600 font-mono">
          Built by <span className="text-zinc-500 font-medium">Sourav</span>. No sign-in.
        </p>
      </footer>

    </div>
  );
}
