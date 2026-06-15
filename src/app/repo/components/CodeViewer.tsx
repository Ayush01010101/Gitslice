"use client";

import { X, Download, FileText, Code2, Loader2 } from "lucide-react";
import { useMemo } from "react";

interface CodeViewerProps {
  filename: string;
  content: string;
  language?: string;
  onClose: () => void;
  rawUrl?: string;
}

/* ---- language detection ---- */
const EXT_LANG_MAP: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript React",
  js: "JavaScript",
  jsx: "JavaScript React",
  py: "Python",
  rs: "Rust",
  go: "Go",
  rb: "Ruby",
  java: "Java",
  css: "CSS",
  scss: "SCSS",
  html: "HTML",
  json: "JSON",
  md: "Markdown",
  yml: "YAML",
  yaml: "YAML",
  sh: "Shell",
  bash: "Shell",
  sql: "SQL",
  c: "C",
  cpp: "C++",
  h: "C Header",
  toml: "TOML",
  xml: "XML",
  svg: "SVG",
};

function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return EXT_LANG_MAP[ext] || "Plain Text";
}

/* ---- syntax highlighting ---- */
const KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "type",
  "interface",
  "extends",
  "implements",
  "class",
  "new",
  "this",
  "typeof",
  "as",
  "in",
  "of",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "default",
  "throw",
  "try",
  "catch",
  "finally",
  "void",
  "null",
  "undefined",
  "true",
  "false",
  "async",
  "await",
  "yield",
  "static",
  "readonly",
  "private",
  "protected",
  "public",
  "abstract",
  "enum",
  "namespace",
  "module",
  "declare",
  "require",
  "super",
  "delete",
  "instanceof",
  "keyof",
  "infer",
  "satisfies",
]);

interface Token {
  text: string;
  type:
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "type"
  | "operator"
  | "punctuation"
  | "identifier"
  | "plain";
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    /* ---- single-line comment ---- */
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.substring(i), type: "comment" });
      break;
    }

    /* ---- block comment start (simplified – single line only) ---- */
    if (line[i] === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      if (end !== -1) {
        tokens.push({
          text: line.substring(i, end + 2),
          type: "comment",
        });
        i = end + 2;
        continue;
      } else {
        tokens.push({ text: line.substring(i), type: "comment" });
        break;
      }
    }

    /* ---- strings ---- */
    if (line[i] === "'" || line[i] === '"' || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") j++;
        j++;
      }
      tokens.push({
        text: line.substring(i, Math.min(j + 1, line.length)),
        type: "string",
      });
      i = Math.min(j + 1, line.length);
      continue;
    }

    /* ---- identifiers / keywords ---- */
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.substring(i, j);
      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ text: word, type: "type" });
      } else {
        tokens.push({ text: word, type: "identifier" });
      }
      i = j;
      continue;
    }

    /* ---- numbers ---- */
    if (/[0-9]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /[0-9.xXa-fA-F_]/.test(line[j])) j++;
      tokens.push({ text: line.substring(i, j), type: "number" });
      i = j;
      continue;
    }

    /* ---- operators ---- */
    if (/[=<>!&|?:+\-*/%^~@#]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /[=<>!&|?:+\-*/%^~]/.test(line[j])) j++;
      tokens.push({ text: line.substring(i, j), type: "operator" });
      i = j;
      continue;
    }

    /* ---- punctuation ---- */
    if (/[{}()\[\];,.]/.test(line[i])) {
      tokens.push({ text: line[i], type: "punctuation" });
      i++;
      continue;
    }

    /* ---- plain (whitespace & everything else) ---- */
    tokens.push({ text: line[i], type: "plain" });
    i++;
  }

  return tokens;
}

const TOKEN_COLORS: Record<Token["type"], string> = {
  keyword: "text-[oklch(0.72_0.16_280)]",
  string: "text-[oklch(0.72_0.13_150)]",
  comment: "text-text-ghost italic",
  number: "text-[oklch(0.75_0.13_55)]",
  type: "text-[oklch(0.75_0.12_200)]",
  operator: "text-text-secondary",
  punctuation: "text-text-muted",
  identifier: "text-text-primary",
  plain: "text-text-primary",
};

/* ------------------------------------------------------------------ */

export default function CodeViewer({
  filename,
  content,
  language,
  onClose,
  rawUrl,
}: CodeViewerProps) {
  const lang = language || detectLanguage(filename);
  const lines = useMemo(() => content.split("\n"), [content]);
  const gutterWidth = String(lines.length).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-background/60 min-w-0 select-none">
      {/* ---- tab bar ---- */}
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-surface/30 pl-1 pr-2 sm:pr-3 min-w-0">
        <div className="flex items-center min-w-0">
          {/* active tab */}
          <div className="flex min-w-0 items-center gap-2 px-3 sm:px-4 py-2.5 bg-background/60 border-b-2 border-[oklch(0.6_0.18_260)] text-text-primary">
            <FileText className="w-3.5 h-3.5 text-text-muted" />
            <span className="min-w-0 max-w-[44vw] truncate text-sm font-medium sm:max-w-none">
              {filename}
            </span>
            <button
              onClick={onClose}
              className="ml-1 p-0.5 rounded hover:bg-surface-hover text-text-ghost hover:text-text-secondary transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {rawUrl && (
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-md border border-border-subtle bg-card/30 hover:bg-surface-hover text-sm text-text-muted hover:text-text-secondary font-medium transition-colors"
            >
              Raw
            </a>
          )}
          {rawUrl && (
            <a
              href={rawUrl}
              download={filename}
              className="p-1.5 rounded-md border border-border-subtle bg-card/30 hover:bg-surface-hover text-text-ghost hover:text-text-secondary transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* ---- code area ---- */}
      <div className="flex-1 overflow-auto scrollbar-thin font-mono text-xs sm:text-sm leading-[1.65]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const tokens = tokenizeLine(line);
              return (
                <tr
                  key={i}
                  className="hover:bg-surface-hover/30 transition-colors"
                >
                  {/* line number */}
                  <td
                    className="text-right select-none px-2 sm:px-4 py-0 text-text-ghost/50 text-xs sm:text-sm align-top sticky left-0 bg-background/80 sm:bg-background/60"
                    style={{
                      minWidth: `${Math.max(gutterWidth * 8 + 24, 40)}px`,
                    }}
                  >
                    {i + 1}
                  </td>

                  {/* code */}
                  <td className="px-3 sm:px-4 py-0 whitespace-pre select-text">
                    {tokens.map((token, j) => (
                      <span key={j} className={TOKEN_COLORS[token.type]}>
                        {token.text}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---- status bar ---- */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-1.5 border-t border-border-subtle bg-surface/30 text-xs text-text-ghost">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3 h-3" />
          <span>{lang}</span>
        </div>
        <span className="hidden sm:inline">
          Ln 1, Col 1
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Empty state shown when no file is selected */
export function CodeViewerEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-background/60 min-w-0 select-none">
      <div className="flex flex-col items-center gap-4 text-text-ghost">
        <div className="p-4 rounded-2xl bg-surface/40 border border-border-subtle">
          <FileText className="w-8 h-8 opacity-30" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-text-muted mb-1">
            Select a file to preview
          </p>
          <p className="text-sm text-text-ghost max-w-60">
            Click on a file in the tree to view its contents here
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Loading skeleton shown while file content is being fetched */
export function CodeViewerLoading({ filename }: { filename: string }) {
  const skeletonLines = [
    { indent: 0, width: "w-32" },
    { indent: 0, width: "w-56" },
    { indent: 1, width: "w-72" },
    { indent: 2, width: "w-48" },
    { indent: 2, width: "w-64" },
    { indent: 1, width: "w-36" },
    { indent: 0, width: "w-16" },
    { indent: 0, width: "w-0" },
    { indent: 0, width: "w-24" },
    { indent: 1, width: "w-80" },
    { indent: 2, width: "w-52" },
    { indent: 2, width: "w-44" },
    { indent: 3, width: "w-60" },
    { indent: 2, width: "w-40" },
    { indent: 1, width: "w-28" },
    { indent: 0, width: "w-16" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background/60 min-w-0 select-none">
      {/* ---- tab bar skeleton ---- */}
      <div className="flex items-center gap-2 border-b border-border-subtle bg-surface/30 pl-1 pr-2 sm:pr-3 min-w-0">
        <div className="flex min-w-0 items-center gap-2 px-3 sm:px-4 py-2.5 bg-background/60 border-b-2 border-[oklch(0.6_0.18_260)] text-text-primary">
          <FileText className="w-3.5 h-3.5 text-text-muted" />
          <span className="min-w-0 max-w-[44vw] truncate text-sm font-medium sm:max-w-none text-text-muted">
            {filename}
          </span>
        </div>
      </div>

      {/* ---- loading body ---- */}
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center gap-6 px-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[oklch(0.6_0.18_260)] animate-spin" />
          <p className="text-sm text-text-ghost">Loading file&hellip;</p>
        </div>

        {/* skeleton code lines */}
        <div className="w-full max-w-lg font-mono text-xs space-y-2 opacity-30">
          {skeletonLines.map((line, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* gutter */}
              <div className="w-6 shrink-0 h-3 rounded bg-surface/60 animate-pulse" />
              {/* indentation spacer */}
              {line.indent > 0 && (
                <div style={{ width: `${line.indent * 16}px` }} className="shrink-0" />
              )}
              {/* code line */}
              {line.width !== "w-0" ? (
                <div
                  className={`h-3 rounded bg-surface/60 animate-pulse ${line.width}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ) : (
                <div className="h-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- status bar skeleton ---- */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-1.5 border-t border-border-subtle bg-surface/30 text-xs text-text-ghost">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3 h-3" />
          <div className="w-16 h-2.5 rounded bg-surface/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
