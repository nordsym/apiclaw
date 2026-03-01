"use client";

import { useState } from "react";
import { Copy, Check, HelpCircle, ArrowRight, Users, Zap, BarChart3, Gift } from "lucide-react";
import { AiClientDropdown, getClientConfig, type AiClient } from "./AiClientDropdown";
import { ConfigHelperModal } from "./ConfigHelperModal";

export function HeroTabs() {
  const [activeTab, setActiveTab] = useState<"connect" | "add">("connect");
  const [selectedClient, setSelectedClient] = useState<AiClient>("other");
  const [showConfigHelper, setShowConfigHelper] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedTerminal, setCopiedTerminal] = useState(false);

  // Config snippets
  const jsonConfig = JSON.stringify({
    mcpServers: {
      apiclaw: {
        command: "npx",
        args: ["@nordsym/apiclaw"]
      }
    }
  }, null, 2);
  
  const chatGptInstructions = `1. Open ChatGPT Settings
2. Go to Connections → Add MCP Server
3. Enter:
   • Name: apiclaw
   • Command: npx @nordsym/apiclaw
4. Save and restart ChatGPT`;

  const configSnippetJson = selectedClient === "chatgpt" ? chatGptInstructions : jsonConfig;

  const terminalCommand = "npx @nordsym/apiclaw mcp-install";

  const copyConfig = () => {
    navigator.clipboard.writeText(configSnippetJson);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const copyTerminal = () => {
    navigator.clipboard.writeText(terminalCommand);
    setCopiedTerminal(true);
    setTimeout(() => setCopiedTerminal(false), 2000);
  };

  const clientConfig = getClientConfig(selectedClient);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto lg:mx-0">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("connect")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === "connect"
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "bg-surface border border-border hover:border-accent/50"
            }`}
          >
            Connect Your Agent
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === "add"
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "bg-surface border border-border hover:border-accent/50"
            }`}
          >
            Add Your API
          </button>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl bg-surface-elevated border border-border p-6 shadow-xl">
          {activeTab === "connect" && (
            <div className="space-y-6">
              {/* Client Selector */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Select your AI:</label>
                <AiClientDropdown value={selectedClient} onChange={setSelectedClient} />
              </div>

              {/* Config Snippet */}
              <div>
                <label className="block text-sm text-text-muted mb-2">
                  {clientConfig.isGui ? "Setup instructions:" : "Add to your config:"}
                </label>
                <div className="code-preview">
                  <div className="code-preview-header">
                    {clientConfig.isGui ? "Instructions" : clientConfig.configPath.split("/").pop()}
                  </div>
                  <div className="code-preview-body">
                    <pre className="text-sm whitespace-pre-wrap text-text-secondary">{configSnippetJson}</pre>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <button onClick={copyConfig} className="btn-primary !py-2 !px-4 text-sm">
                    {copiedConfig ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedConfig ? "Copied!" : "Copy Config"}
                  </button>
                  <button
                    onClick={() => setShowConfigHelper(true)}
                    className="btn-ghost !py-2 !px-4 text-sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Where's my config file?
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-text-muted">or run directly</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Terminal Command - Clickable */}
              <div className="relative">
                <button 
                  onClick={copyTerminal}
                  className={`w-full text-left transition-all rounded-xl overflow-hidden hover:ring-2 hover:ring-accent/50 ${copiedTerminal ? "ring-2 ring-green-500" : ""}`}
                >
                  <div className="code-preview">
                    <div className="code-preview-header flex items-center justify-between">
                      <span>terminal</span>
                      <span className="flex items-center gap-1 text-xs">
                        {copiedTerminal ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copiedTerminal ? "Copied!" : "Click to copy"}
                      </span>
                    </div>
                    <div className="code-preview-body">
                      <pre className="text-sm">
                        <span className="text-green-400">$</span> <span className="text-blue-400">npx</span> @nordsym/apiclaw mcp-install
                      </pre>
                    </div>
                  </div>
                </button>
                {copiedTerminal && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg animate-fade-in">
                    ✓ Run this in your terminal!
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "add" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Make your API available to AI agents</h3>
                <p className="text-text-secondary">
                  Self-service onboarding. Live in minutes. Free to list.
                </p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-text-secondary">
                  <Users className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Reach thousands of AI agents</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>No code changes required</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <BarChart3 className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Analytics & usage insights</span>
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Gift className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>Free to list</span>
                </li>
              </ul>

              <a
                href="/providers/dashboard"
                className="btn-primary w-full justify-center"
              >
                Open Provider Dashboard
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      <ConfigHelperModal isOpen={showConfigHelper} onClose={() => setShowConfigHelper(false)} />
    </>
  );
}
