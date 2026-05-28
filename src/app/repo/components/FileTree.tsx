"use client";

import {
  ChevronLeft,
  Plus,
  Copy,
  Download,
  ChevronDown,
  Folder,
  FileText,
  Check,
} from "lucide-react";
import { useMemo, useState } from "react";

export interface TreeItem {
  name: string;
  type: "file" | "dir";
  path: string;
  size?: number;
  sha: string;
  download_url?: string | null;
}

interface FileTreeProps {
  items: TreeItem[];
  currentPath: string[];
  selectedItems: Set<string>;
  onNavigate: (path: string[]) => void;
  onToggleSelect: (path: string) => void;
  onSelectAll: (selected: boolean) => void;
  onOpenFile: (item: TreeItem) => void;
  onDownloadSelected: () => void;
  loading?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */

export default function FileTree({
  items,
  currentPath,
  selectedItems,
  onNavigate,
  onToggleSelect,
  onSelectAll,
  onOpenFile,
  onDownloadSelected,
  loading = false,
}: FileTreeProps) {
  const [copiedPath, setCopiedPath] = useState(false);

  /* sort: folders first, then alphabetical */
  const sorted = useMemo(() => {
    const dirs = items.filter((i) => i.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
    const files = items.filter((i) => i.type === "file").sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  }, [items]);

  const allChecked =
    sorted.length > 0 && sorted.every((i) => selectedItems.has(i.path));
  const someChecked = sorted.some((i) => selectedItems.has(i.path));

  /* selection stats */
  const selectedCount = selectedItems.size;
  const selectedSize = useMemo(() => {
    let total = 0;
    items.forEach((item) => {
      if (selectedItems.has(item.path) && item.size) total += item.size;
    });
    return total;
  }, [items, selectedItems]);

  const handleCopyPath = () => {
    const pathStr = "/" + currentPath.join("/");
    navigator.clipboard.writeText(pathStr);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div className="w-[340px] shrink-0 border-r border-border-subtle bg-surface/30 flex flex-col h-full select-none">
      {/* ---- header ---- */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {currentPath.length > 0 && (
            <button
              onClick={() => onNavigate(currentPath.slice(0, -1))}
              className="p-1 rounded-md hover:bg-surface-hover text-text-ghost hover:text-text-secondary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">
            Tree
          </h2>
        </div>
      </div>

      {/* ---- breadcrumb ---- */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1 text-xs text-text-ghost overflow-x-auto">
          <button
            onClick={() => onNavigate([])}
            className="hover:text-text-secondary transition-colors cursor-pointer shrink-0 font-mono"
          >
            /
          </button>
          {currentPath.map((segment, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <span className="text-text-ghost">/</span>
              <button
                onClick={() => onNavigate(currentPath.slice(0, i + 1))}
                className="hover:text-text-secondary transition-colors cursor-pointer font-mono"
              >
                {segment}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ---- toolbar ---- */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        <button className="p-1.5 rounded-md border border-border-subtle bg-card/30 hover:bg-surface-hover text-text-ghost hover:text-text-secondary transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCopyPath}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border-subtle bg-card/30 hover:bg-surface-hover text-text-ghost hover:text-text-secondary text-xs transition-colors cursor-pointer"
        >
          {copiedPath ? (
            <Check className="w-3.5 h-3.5 text-[oklch(0.65_0.15_150)]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copiedPath ? "Copied" : "Copy path"}
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border-subtle bg-card/30 hover:bg-surface-hover text-text-ghost hover:text-text-secondary text-xs transition-colors cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          Download
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* ---- divider ---- */}
      <div className="h-px bg-border-subtle" />

      {/* ---- table header ---- */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle">
        {/* select-all checkbox */}
        <button
          onClick={() => onSelectAll(!allChecked)}
          className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            allChecked
              ? "bg-[oklch(0.55_0.2_260)] border-[oklch(0.55_0.2_260)]"
              : someChecked
              ? "bg-[oklch(0.55_0.2_260)]/50 border-[oklch(0.55_0.2_260)]"
              : "border-border-default hover:border-border-hover"
          }`}
        >
          {(allChecked || someChecked) && (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </button>
        <span className="text-xs font-medium text-text-muted">Name</span>
      </div>

      {/* ---- file list ---- */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-3 space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2 py-2.5 animate-pulse"
              >
                <div className="w-4 h-4 rounded bg-surface-hover" />
                <div className="w-4 h-4 rounded bg-surface-hover" />
                <div className="h-3 flex-1 rounded bg-surface-hover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-2 py-1">
            {/* parent directory */}
            {currentPath.length > 0 && (
              <button
                onClick={() => onNavigate(currentPath.slice(0, -1))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover/60 transition-colors cursor-pointer group"
              >
                <div className="w-4" />
                <span className="text-xs text-text-ghost">📁</span>
                <span className="text-xs text-text-muted group-hover:text-text-secondary font-medium">
                  ..
                </span>
              </button>
            )}

            {sorted.map((item) => {
              const isChecked = selectedItems.has(item.path);
              return (
                <div
                  key={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover/60 transition-colors group"
                >
                  {/* checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(item.path);
                    }}
                    className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isChecked
                        ? "bg-[oklch(0.55_0.2_260)] border-[oklch(0.55_0.2_260)]"
                        : "border-border-default hover:border-border-hover"
                    }`}
                  >
                    {isChecked && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </button>

                  {/* icon */}
                  {item.type === "dir" ? (
                    <Folder className="w-4 h-4 text-text-ghost shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-text-ghost shrink-0" />
                  )}

                  {/* name — clickable */}
                  <button
                    onClick={() => {
                      if (item.type === "dir") {
                        onNavigate([...currentPath, item.name]);
                      } else {
                        onOpenFile(item);
                      }
                    }}
                    className="flex-1 text-left text-xs text-text-secondary group-hover:text-text-primary font-medium transition-colors cursor-pointer truncate"
                  >
                    {item.name}
                  </button>

                  {/* size */}
                  {item.type === "file" && item.size !== undefined && (
                    <span className="text-[10px] text-text-ghost font-mono shrink-0">
                      {formatSize(item.size)}
                    </span>
                  )}

                  {/* download icon */}
                  {item.type === "file" && item.download_url && (
                    <a
                      href={item.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-0.5 rounded hover:bg-surface-active text-text-ghost hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })}

            {/* empty state */}
            {sorted.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-text-ghost">
                <Folder className="w-6 h-6 mb-2 opacity-40" />
                <p className="text-xs">No files in this directory</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- selection bar ---- */}
      {selectedCount > 0 && (
        <div className="border-t border-border-subtle px-4 py-3 flex items-center justify-between bg-card/30 backdrop-blur-sm">
          <span className="text-xs text-text-muted">
            <span className="font-semibold text-text-secondary">
              {selectedCount} item{selectedCount > 1 ? "s" : ""}
            </span>{" "}
            selected
            {selectedSize > 0 && (
              <span className="ml-1.5 text-text-ghost">
                · {formatSize(selectedSize)}
              </span>
            )}
          </span>

          <button
            onClick={onDownloadSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.5_0.16_260)] hover:bg-[oklch(0.55_0.18_260)] text-white text-[11px] font-semibold transition-all duration-200 cursor-pointer active:scale-[0.97] shadow-[0_0_15px_oklch(0.4_0.12_260_/_20%)]"
          >
            <Download className="w-3.5 h-3.5" />
            Download Selected (ZIP)
          </button>
        </div>
      )}
    </div>
  );
}
