"use client";

import { X, ExternalLink, Folder } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const configLocations = [
  {
    name: "Claude Desktop",
    paths: [
      { os: "Mac", path: "~/Library/Application Support/Claude/", file: "claude_desktop_config.json" },
      { os: "Windows", path: "%APPDATA%\\Claude\\", file: "claude_desktop_config.json" },
      { os: "Linux", path: "~/.config/Claude/", file: "claude_desktop_config.json" },
    ],
  },
  {
    name: "ChatGPT",
    paths: [
      { os: "All", path: "Settings → Connections → Add MCP Server", file: "" },
    ],
    isGui: true,
  },
  {
    name: "Cursor",
    paths: [
      { os: "All", path: "~/.cursor/mcp.json", file: "" },
    ],
  },
  {
    name: "Cline",
    paths: [
      { os: "All", path: "~/.cline/mcp_config.json", file: "" },
    ],
  },
];

export function ConfigHelperModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Folder className="w-5 h-5 text-accent" />
              Config File Locations
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {configLocations.map((client, i) => (
            <div key={i} className="p-3 sm:p-4 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm sm:text-base">{client.name}</span>
                {client.isGui && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">GUI</span>
                )}
              </div>
              
              <div className="space-y-1.5">
                {client.paths.map((p, j) => (
                  <div key={j} className="text-xs sm:text-sm">
                    {p.os !== "All" && (
                      <span className="text-text-muted mr-1">{p.os}:</span>
                    )}
                    <code className="text-text-secondary bg-surface-elevated px-1.5 py-0.5 rounded text-xs break-all">
                      {p.path}{p.file && ` ${p.file}`}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-surface/50">
          <p className="text-xs sm:text-sm text-text-muted mb-3 text-center">
            After adding config, restart your AI app.
          </p>
          <a
            href="https://github.com/nordsym/apiclaw#installation"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full justify-center text-sm"
          >
            <span>Full Setup Guide</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
