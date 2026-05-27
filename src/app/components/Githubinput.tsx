"use client";

import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { GitBranchMinus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface GithubSearchInputProps extends Omit<React.ComponentProps<"input">, "onSubmit"> {
  onSubmit?: (value: string) => void;
}

export function GithubSearchInput({
  className,
  value,
  onChange,
  placeholder = "Paste repo link",
  onSubmit,
  ...props
}: GithubSearchInputProps) {
  const [inputValue, setInputValue] = React.useState((value as string) || "");
  const [isFocused, setIsFocused] = React.useState(false);

  // Sync internal state with prop value
  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue((value as string) || "");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(inputValue);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-1.5 p-1.5 w-full rounded-2xl border bg-zinc-950/80 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.8)]",
        isFocused
          ? "border-zinc-700 shadow-[0_0_25px_rgba(255,255,255,0.02),0_20px_50px_rgba(0,0,0,0.8)]"
          : "border-zinc-800/80 hover:border-zinc-700/80",
        className
      )}
    >
      <div className="flex items-center pl-3 text-zinc-500 shrink-0">
        <GitBranchMinus className="w-5 h-5 text-zinc-400" />
      </div>

      <ShadcnInput
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-grow h-10 border-0 bg-transparent text-white placeholder-zinc-500 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2 text-base md:text-sm"
        {...props}
      />

      <button
        type="submit"
        className="flex items-center justify-center w-10 h-10 bg-zinc-200 hover:bg-zinc-100 text-zinc-950 rounded-xl transition-all duration-200 shadow-[0_0_12px_rgba(255,255,255,0.04)] cursor-pointer shrink-0 active:scale-95"
      >
        <Search className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
      </button>
    </form>
  );
}

