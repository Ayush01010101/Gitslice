"use client";


import { Spotlight } from "@/components/ui/spotlight-new";
import TextType from "@/components/TextType";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GithubSearchInput } from "./components/Githubinput";

import { GitBranchMinus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GitHubStatsHome() {
  const [repourl, setrepourl] = useState<string>("")
  const router = useRouter()
  console.log(process.env.github_api_url)

  return (
    <div className="min-h-screen w-full bg-surface text-text-primary font-sans relative overflow-hidden flex flex-col justify-between selection:bg-foreground selection:text-background">


      <Spotlight height={2000} />
      <div className="relative z-10 w-full grow flex flex-col">

        {/* Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-surface-hover/20 backdrop-blur-md">
            <GitBranchMinus className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-semibold tracking-tight opacity-70 text-foreground cursor-pointer" onClick={() => { window.open("https://github.com/Ayush01010101/Gitslice") }}>GitSlice</span>
            <span className="px-1.5 py-0.5 rounded-full bg-badge-bg text-[9px] font-bold text-badge-text border border-badge-border">beta</span>
          </div>

          <Button onClick={() => window.open("https://github.com/Ayush01010101/Gitslice")} className="hidden md:flex gap-2 items-center text-xs text-text-muted font-mono tracking-wider">
            Gitub Star<Star />
          </Button>
        </header>

        {/* Main Landing Area */}
        <main className="w-full max-w-7xl mx-auto px-6 flex-grow flex flex-col justify-center">

          <div className="w-full flex flex-col items-center py-10 md:py-20 relative">


            {/* Title Section with Metallic Chrome Gradients */}
            <div className="text-center max-w-3xl z-10 mb-12">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-center leading-[1.2] mb-6">
                <span className="bg-clip-text text-transparent bg-linear-to-b opacity-70 from-heading-from via-heading-via to-heading-to">
                  Download any <br />
                </span>{" "}
                <span className="bg-clip-text text-transparent bg-linear-to-b opacity-70 from-heading-from via-heading-via to-heading-to">
                  GitHub repo's<br />
                </span>{" "}
                <span className="relative inline-flex items-center justify-center px-5 py-1 mx-1.5 bg-surface-active/40 border border-border-default/80 rounded-xl shadow-[0_0_20px_color-mix(in_oklch,var(--foreground)_1%,transparent)]">
                  {/* Subtle technical bracket/corner ticks */}
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-corner-tick"></span>
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-corner-tick"></span>
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-corner-tick"></span>
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-corner-tick"></span>
                  <span className="relative bg-clip-text text-foreground bg-linear-to-b from-foreground to-text-secondary font-semibold font-mono tracking-tight">
                    {/* main text here */}

                    <TextType
                      text={["Text typing effect", "for your websites", "Happy coding!"]}
                      typingSpeed={75}
                      pauseDuration={1500}
                      showCursor={true}
                      cursorCharacter="_"
                      texts={["Commit", "Folder", "File", "Snapshot", "Source"]}
                      className="opacity-70"
                      deletingSpeed={50}
                      variableSpeedEnabled={false}
                      variableSpeedMin={60}
                      variableSpeedMax={120}
                      cursorBlinkDuration={0.5}
                    />
                  </span>
                </span>{" "}
                {/* <span className="bg-clip-text text-transparent bg-linear-to-b opacity-70 from-heading-from via-heading-via to-heading-to"> */}
                {/*   directly */}
                {/* </span> */}
              </h1>

              <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto opacity-70 leading-relaxed mt-4">
                Paste a GitHub URL, pick your commit,
                and download exactly what you need in seconds.
              </p>
            </div>

            {/* Search Input component (uses shadcn input inside) */}
            <div className="w-full max-w-2xl px-4 z-10">
              <GithubSearchInput
                placeholder="Paste github repo url"
                value={repourl}

                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setrepourl(e.target.value)
                }}
                onSubmit={(val) => {

                  const extractedRepoNameandOwner = repourl.split("/")

                  const routeToNavigate = `${extractedRepoNameandOwner[3]}/${extractedRepoNameandOwner[4]}`
                  router.push(`/repo/${routeToNavigate}`)
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border-default bg-surface/10 hover:border-border-hover hover:bg-surface-hover/30 text-xs text-text-faint hover:text-foreground transition-all duration-300 cursor-pointer"
                >
                  {chip.label === "Sourav" && (
                    <span className="text-[10px] text-text-faint font-mono mr-0.5">風</span>
                  )}
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

          </div>

        </main>
      </div >

      {/* Footer */}
      < footer className="relative z-10 w-full py-8 text-center border-t border-footer-border" >
        <p className="text-xs text-text-ghost font-mono">
          Develop by <span onClick={() => { window.open("https://github.com/Ayush01010101") }} className="text-text-muted font-medium cursor-pointer">Ayush</span>. Design by <span onClick={() => { window.open("https://github.com/souravsolutions") }} className="text-text-muted font-medium cursor-pointer">Sourav</span>
        </p>
      </footer >

    </div >
  );
}
