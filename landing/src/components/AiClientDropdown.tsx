"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type AiClient = "claude" | "chatgpt" | "cursor" | "cline" | "other";

interface AiClientOption {
  value: AiClient;
  label: string;
  configPath: string;
  isGui?: boolean;
}

const clients: AiClientOption[] = [
  {
    value: "claude",
    label: "Claude Desktop",
    configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
  },
  {
    value: "chatgpt",
    label: "ChatGPT",
    configPath: "Settings → Connections → Add MCP Server",
    isGui: true,
  },
  {
    value: "cursor",
    label: "Cursor",
    configPath: "~/.cursor/mcp.json",
  },
  {
    value: "cline",
    label: "Cline",
    configPath: "~/.cline/mcp_config.json",
  },
  {
    value: "other",
    label: "Other",
    configPath: "See documentation",
  },
];

interface Props {
  value: AiClient;
  onChange: (client: AiClient) => void;
}

export function AiClientDropdown({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.value === value) || clients[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 w-full sm:w-64 px-4 py-3 rounded-xl bg-surface border border-border hover:border-accent/50 transition-colors text-left"
      >
        <span className="font-medium">{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full sm:w-64 rounded-xl bg-surface-elevated border border-border shadow-xl overflow-hidden">
          {clients.map((client) => (
            <button
              key={client.value}
              onClick={() => {
                onChange(client.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-surface transition-colors ${
                client.value === value ? "bg-accent/10 text-accent" : ""
              }`}
            >
              <div className="font-medium">{client.label}</div>
              <div className="text-xs text-text-muted truncate">{client.configPath}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function getClientConfig(client: AiClient): AiClientOption {
  return clients.find((c) => c.value === client) || clients[0];
}
