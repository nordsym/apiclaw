"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Target,
  CheckCircle,
  Circle,
  Zap,
  Bot,
  Code,
  Github,
  Twitter,
  Users,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Loader2,
  Key,
} from "lucide-react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

// ============================================
// TYPES
// ============================================

interface EarnProgress {
  // Usage tasks
  firstDirectCall: boolean;
  firstDirectCallAt: number | null;
  apisUsed: string[];
  apisUsedComplete: boolean;
  agentListed: boolean;
  agentListedAt: number | null;
  apiListed: boolean;
  apiListedAt: number | null;
  byokSetup: boolean;
  byokSetupAt: number | null;
  // Growth tasks
  githubStarred: boolean;
  githubStarredAt: number | null;
  twitterFollowed: boolean;
  twitterFollowedAt: number | null;
  // Referrals
  referralCount: number;
  referralCode: string;
  // Calculated
  totalEarned: number;
}

interface TaskConfig {
  id: string;
  title: string;
  credits: number;
  icon: React.ComponentType<{ className?: string }>;
  category: "usage" | "growth";
  getState: (progress: EarnProgress) => TaskState;
  getProgress?: (progress: EarnProgress) => { current: number; total: number } | null;
  action?: {
    type: "link" | "copy" | "navigate";
    label: string;
    href?: string;
    copyValue?: string;
    navigateTo?: string;
  };
}

type TaskState = "open" | "in-progress" | "completed";

interface EarnCreditsTabProps {
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}

// ============================================
// TASK CONFIGURATIONS
// ============================================

const TASKS: TaskConfig[] = [
  // USAGE TASKS
  {
    id: "first-direct-call",
    title: "First Direct Call",
    credits: 15,
    icon: Zap,
    category: "usage",
    getState: (p) => (p.firstDirectCall ? "completed" : "open"),
    action: {
      type: "navigate",
      label: "Make a call",
      navigateTo: "/workspace?tab=api-catalog",
    },
  },
  {
    id: "test-3-apis",
    title: "Test 3 APIs",
    credits: 10,
    icon: Code,
    category: "usage",
    getState: (p) => {
      if (p.apisUsedComplete) return "completed";
      if (p.apisUsed.length > 0) return "in-progress";
      return "open";
    },
    getProgress: (p) => ({
      current: Math.min(p.apisUsed.length, 3),
      total: 3,
    }),
    action: {
      type: "navigate",
      label: "Explore APIs",
      navigateTo: "/workspace?tab=api-catalog",
    },
  },
  {
    id: "list-agent",
    title: "List your Agent",
    credits: 10,
    icon: Bot,
    category: "usage",
    getState: (p) => (p.agentListed ? "completed" : "open"),
    action: {
      type: "navigate",
      label: "List agent",
      navigateTo: "/workspace?tab=my-agents",
    },
  },
  {
    id: "list-api",
    title: "List your API",
    credits: 10,
    icon: Code,
    category: "usage",
    getState: (p) => (p.apiListed ? "completed" : "open"),
    action: {
      type: "navigate",
      label: "List API",
      navigateTo: "/providers/register",
    },
  },
  {
    id: "setup-byok",
    title: "Set up Direct Call/BYOK",
    credits: 5,
    icon: Key,
    category: "usage",
    getState: (p) => (p.byokSetup ? "completed" : "open"),
    action: {
      type: "navigate",
      label: "Add key",
      navigateTo: "/workspace?tab=api-keys",
    },
  },
  // GROWTH TASKS
  {
    id: "star-github",
    title: "Star on GitHub",
    credits: 10,
    icon: Github,
    category: "growth",
    getState: (p) => (p.githubStarred ? "completed" : "open"),
    action: {
      type: "link",
      label: "Star repo",
      href: "https://github.com/nordsym/apiclaw",
    },
  },
  {
    id: "follow-twitter",
    title: "Follow @NordSym",
    credits: 5,
    icon: Twitter,
    category: "growth",
    getState: (p) => (p.twitterFollowed ? "completed" : "open"),
    action: {
      type: "link",
      label: "Follow",
      href: "https://x.com/NordSym",
    },
  },
  {
    id: "invite-friends",
    title: "Invite Friends",
    credits: 10,
    icon: Users,
    category: "growth",
    getState: (p) => (p.referralCount > 0 ? "completed" : "open"),
    getProgress: (p) =>
      p.referralCount > 0
        ? { current: p.referralCount, total: p.referralCount }
        : null,
    action: {
      type: "copy",
      label: "Copy link",
      copyValue: "", // Will be filled dynamically with referral code
    },
  },
];

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

function ProgressBar({
  current,
  max,
  animate = true,
}: {
  current: number;
  max: number;
  animate?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : current);
  const percentage = Math.min((displayValue / max) * 100, 100);

  useEffect(() => {
    if (animate && displayValue !== current) {
      const timer = setTimeout(() => {
        const diff = current - displayValue;
        const step = Math.max(1, Math.ceil(Math.abs(diff) / 20));
        setDisplayValue((prev) =>
          diff > 0 ? Math.min(prev + step, current) : Math.max(prev - step, current)
        );
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [animate, current, displayValue]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-muted)]">Progress</span>
        <span className="font-medium">
          <span className="text-[#ef4444]">{displayValue}</span>
          <span className="text-[var(--text-muted)]">/{max} calls earned</span>
        </span>
      </div>
      <div className="h-3 bg-[var(--surface)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#ef4444] to-[#f97316] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {displayValue >= max && (
        <p className="text-sm text-green-500 font-medium flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          All tasks completed!
        </p>
      )}
    </div>
  );
}

// ============================================
// TASK CARD COMPONENT
// ============================================

function TaskCard({
  task,
  progress,
  onClaim,
  isClaiming,
  referralCode,
  showToast,
}: {
  task: TaskConfig;
  progress: EarnProgress;
  onClaim: (taskId: string) => void;
  isClaiming: boolean;
  referralCode: string;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  const state = task.getState(progress);
  const progressData = task.getProgress?.(progress);
  const Icon = task.icon;

  // Animation when task completes
  useEffect(() => {
    if (state === "completed") {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleAction = async () => {
    if (state === "completed") return;

    if (task.action?.type === "link" && task.action.href) {
      window.open(task.action.href, "_blank", "noopener,noreferrer");
      // For GitHub and Twitter, trigger claim after a short delay
      if (task.id === "star-github" || task.id === "follow-twitter") {
        setTimeout(() => onClaim(task.id), 2000);
      }
    } else if (task.action?.type === "copy") {
      const link = `https://apiclaw.com/join?ref=${referralCode}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showToast?.("Referral link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    } else if (task.action?.type === "navigate" && task.action.navigateTo) {
      window.location.href = task.action.navigateTo;
    }
  };

  const renderIcon = () => {
    if (state === "completed") {
      return (
        <div
          className={`w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center transition-transform duration-300 ${
            justCompleted ? "scale-125" : "scale-100"
          }`}
        >
          <CheckCircle
            className={`w-5 h-5 text-green-500 transition-all duration-300 ${
              justCompleted ? "scale-110" : "scale-100"
            }`}
          />
        </div>
      );
    }

    if (state === "in-progress" && progressData) {
      const fillPercent = (progressData.current / progressData.total) * 100;
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-blue-500/30 transition-all duration-500"
            style={{ height: `${fillPercent}%` }}
          />
          <Circle className="w-5 h-5 text-blue-500 relative z-10" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-[var(--surface)] flex items-center justify-center">
        <Circle className="w-5 h-5 text-[var(--text-muted)]" />
      </div>
    );
  };

  const renderAction = () => {
    if (state === "completed") {
      return (
        <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-500 text-sm font-medium">
          CLAIMED
        </span>
      );
    }

    if (state === "in-progress" && progressData) {
      return (
        <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-500 text-sm font-medium">
          {progressData.current}/{progressData.total}
        </span>
      );
    }

    if (task.action) {
      if (task.action.type === "copy") {
        return (
          <button
            onClick={handleAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {task.action.label}
              </>
            )}
          </button>
        );
      }

      return (
        <button
          onClick={handleAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition-colors"
        >
          {task.action.label}
          {task.action.type === "link" ? (
            <ExternalLink className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      );
    }

    return null;
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
        state === "completed"
          ? "bg-green-500/5 border border-green-500/20"
          : state === "in-progress"
          ? "bg-blue-500/5 border border-blue-500/20"
          : "bg-[var(--surface)] border border-[var(--border)] hover:border-[#ef4444]/30"
      }`}
    >
      <div className="flex items-center gap-4">
        {renderIcon()}
        <div>
          <div className="flex items-center gap-2">
            <Icon
              className={`w-4 h-4 ${
                state === "completed"
                  ? "text-green-500"
                  : state === "in-progress"
                  ? "text-blue-500"
                  : "text-[var(--text-muted)]"
              }`}
            />
            <span
              className={`font-medium ${
                state === "completed" ? "text-green-500" : ""
              }`}
            >
              {task.title}
            </span>
          </div>
          <span className="text-sm text-[#ef4444] font-medium">
            +{task.credits} calls
            {task.id === "invite-friends" && " per referral"}
          </span>
        </div>
      </div>
      {renderAction()}
    </div>
  );
}

// ============================================
// TASK SECTION COMPONENT
// ============================================

function TaskSection({
  title,
  tasks,
  progress,
  onClaim,
  isClaiming,
  referralCode,
  showToast,
}: {
  title: string;
  tasks: TaskConfig[];
  progress: EarnProgress;
  onClaim: (taskId: string) => void;
  isClaiming: boolean;
  referralCode: string;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            progress={progress}
            onClaim={onClaim}
            isClaiming={isClaiming}
            referralCode={referralCode}
            showToast={showToast}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// REFERRAL SECTION COMPONENT
// ============================================

function ReferralSection({
  referralCode,
  referralCount,
  showToast,
}: {
  referralCode: string;
  referralCount: number;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}) {
  const [copied, setCopied] = useState(false);

  const referralUrl = referralCode
    ? `https://apiclaw.com/join?ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    showToast?.("Referral link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#ef4444]/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#ef4444]" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Invite Friends</h3>
          <p className="text-sm text-[var(--text-muted)]">
            +10 calls per referral (unlimited)
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] font-mono text-sm truncate">
            {referralUrl || "Loading..."}
          </div>
          <button
            onClick={handleCopy}
            disabled={!referralCode}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#ef4444] text-white font-medium hover:bg-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Referral Code Display */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--text-muted)]">Your code:</span>
          <code className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[#ef4444]">
            {referralCode || "---"}
          </code>
        </div>

        {/* Stats */}
        {referralCount > 0 && (
          <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <span className="font-medium text-green-500">
                {referralCount} friend{referralCount !== 1 ? "s" : ""} joined
              </span>
              <span className="text-[var(--text-muted)] ml-2">
                (+{referralCount * 10} calls earned)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function EarnCreditsTab({ showToast }: EarnCreditsTabProps) {
  const [progress, setProgress] = useState<EarnProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // First ensure user has a referral code
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "earnProgress:ensureReferralCode",
          args: { token },
        }),
      });

      // Then fetch progress with referral info
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "earnProgress:getByToken",
          args: { token },
        }),
      });

      const data = await res.json();
      const result = data.value || data;

      if (result && !result.error) {
        setProgress(result);
      } else {
        // Initialize with defaults if no progress exists yet
        setProgress({
          firstDirectCall: false,
          firstDirectCallAt: null,
          apisUsed: [],
          apisUsedComplete: false,
          agentListed: false,
          agentListedAt: null,
          apiListed: false,
          apiListedAt: null,
          byokSetup: false,
          byokSetupAt: null,
          githubStarred: false,
          githubStarredAt: null,
          twitterFollowed: false,
          twitterFollowedAt: null,
          referralCount: 0,
          referralCode: "",
          totalEarned: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch earn progress:", err);
      setError("Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleClaim = async (taskId: string) => {
    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token || !progress) return;

    setIsClaiming(true);

    try {
      let mutationPath = "";
      switch (taskId) {
        case "star-github":
          mutationPath = "earnProgress:claimGithub";
          break;
        case "follow-twitter":
          mutationPath = "earnProgress:claimTwitter";
          break;
        default:
          return;
      }

      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: mutationPath,
          args: { token },
        }),
      });

      const data = await res.json();
      const result = data.value || data;

      if (result.success) {
        // Get task credits
        const task = TASKS.find((t) => t.id === taskId);
        if (task) {
          showToast?.(
            `+${task.credits} calls earned! ${task.title} complete.`,
            "success"
          );
        }
        // Refresh progress
        await fetchProgress();
      }
    } catch (err) {
      console.error("Failed to claim:", err);
      showToast?.("Failed to claim reward", "error");
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-muted)]">{error || "Unable to load progress"}</p>
      </div>
    );
  }

  const usageTasks = TASKS.filter((t) => t.category === "usage");
  const growthTasks = TASKS.filter((t) => t.category === "growth");

  // Calculate total earned
  const calculatedTotal = calculateTotalEarned(progress);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Earn Credits</h2>
        <p className="text-[var(--text-muted)]">
          Complete tasks to earn free API calls. Up to 65 calls available (plus unlimited referrals).
        </p>
      </div>

      {/* Progress Section */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ef4444]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#ef4444]" />
          </div>
          <h3 className="font-semibold text-lg">Earn Progress</h3>
        </div>
        <ProgressBar current={calculatedTotal} max={65} />
      </div>

      {/* Usage Tasks */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <TaskSection
          title="Usage"
          tasks={usageTasks}
          progress={progress}
          onClaim={handleClaim}
          isClaiming={isClaiming}
          referralCode={progress.referralCode}
          showToast={showToast}
        />
      </div>

      {/* Growth Tasks (excluding referral - has dedicated section) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <TaskSection
          title="Growth"
          tasks={growthTasks.filter((t) => t.id !== "invite-friends")}
          progress={progress}
          onClaim={handleClaim}
          isClaiming={isClaiming}
          referralCode={progress.referralCode || ""}
          showToast={showToast}
        />
      </div>

      {/* Referral Section */}
      <ReferralSection
        referralCode={progress.referralCode || ""}
        referralCount={progress.referralCount}
        showToast={showToast}
      />

      {/* Info Box */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="font-semibold mb-3">How it works</h3>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Complete tasks to earn bonus API calls</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>One-time bonus: up to 65 calls from tasks</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Referrals: unlimited (+10 calls per friend)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Monthly free tier: 50 calls (refreshes each month)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function generateReferralCode(): string {
  return "CLAW-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculateTotalEarned(progress: EarnProgress): number {
  let total = 0;

  // Usage tasks
  if (progress.firstDirectCall) total += 15;
  if (progress.apisUsedComplete) total += 10;
  if (progress.agentListed) total += 10;
  if (progress.apiListed) total += 10;
  if (progress.byokSetup) total += 5;

  // Growth tasks (excluding referrals for the 65 cap)
  if (progress.githubStarred) total += 10;
  if (progress.twitterFollowed) total += 5;

  return Math.min(total, 65);
}

function calculateTotalWithReferrals(progress: EarnProgress): number {
  const baseTotal = calculateTotalEarned(progress);
  const referralBonus = progress.referralCount * 10;
  return baseTotal + referralBonus;
}

export default EarnCreditsTab;
