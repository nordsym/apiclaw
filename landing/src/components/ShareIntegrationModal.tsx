"use client";

import { useState } from "react";
import { X, Twitter, Linkedin, Copy, Check, ExternalLink } from "lucide-react";

interface ShareIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  apiName: string;
  apiSlug: string;
  description?: string;
}

export function ShareIntegrationModal({
  isOpen,
  onClose,
  providerName,
  apiName,
  apiSlug,
  description,
}: ShareIntegrationModalProps) {
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const providerUrl = `https://apiclaw.cloud/providers/${apiSlug}`;
  
  const twitterText = `🦞 ${apiName} is now on @APIClaw!

AI agents can integrate our API in seconds.

${description || "Check it out:"}

${providerUrl}

#AI #API #AIAgents`;

  const linkedinText = `Excited to announce that ${providerName} is now available on APIClaw — the Control Plane for AI Agents.

AI agents can now reach ${apiName} through the same unified runtime they already use for execution, missions, and observability.

We're proud to be among the providers on this platform. ${providerUrl}`;

  const badgeCode = `<a href="${providerUrl}" target="_blank" rel="noopener">
  <img src="https://apiclaw.cloud/badges/available-on-apiclaw.svg" 
       alt="Available on APIClaw" 
       width="220" height="44" />
</a>`;

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(providerUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const handleCopyBadge = async () => {
    await navigator.clipboard.writeText(badgeCode);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(providerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface-elevated border border-border rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">You're Live on APIClaw!</h2>
          <p className="text-text-muted">
            AI agents can now discover and use {apiName}.
          </p>
        </div>

        {/* Share section */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Share the news</h3>
            <div className="flex gap-3">
              <button
                onClick={handleTwitterShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-xl transition-colors font-medium"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </button>
              <button
                onClick={handleLinkedInShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] hover:bg-[#094d92] text-white rounded-xl transition-colors font-medium"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn
              </button>
            </div>
          </div>

          {/* Badge section */}
          <div>
            <h3 className="font-semibold mb-3">Add badge to your site</h3>
            <div className="bg-surface rounded-xl p-4 border border-border">
              {/* Badge preview */}
              <div className="flex justify-center mb-4 p-4 bg-white/5 rounded-lg">
                <img 
                  src="/badges/available-on-apiclaw.svg" 
                  alt="Available on APIClaw badge"
                  width={220}
                  height={44}
                />
              </div>
              {/* Code */}
              <div className="relative">
                <pre className="text-xs text-text-muted bg-black/30 rounded-lg p-3 overflow-x-auto">
                  {badgeCode}
                </pre>
                <button
                  onClick={handleCopyBadge}
                  className="absolute top-2 right-2 p-2 bg-surface-elevated hover:bg-surface rounded-lg transition-colors"
                >
                  {copiedBadge ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Direct link */}
          <div>
            <h3 className="font-semibold mb-3">Your provider page</h3>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-surface rounded-xl border border-border text-sm text-text-muted truncate">
                {providerUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-surface hover:bg-surface-elevated border border-border rounded-xl transition-colors"
              >
                {copiedLink ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-text-muted" />
                )}
              </button>
              <a
                href={providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-surface hover:bg-surface-elevated border border-border rounded-xl transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-text-muted" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
