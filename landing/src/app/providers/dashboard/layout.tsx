"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Zap,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Sun,
  Moon,
  Home,
  PlayCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  exact?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: "Overview", href: "/providers/dashboard", icon: Home, exact: true },
  { label: "APIs", href: "/providers/dashboard", icon: Zap }, // Tab in main dashboard
  { label: "Earnings", href: "/providers/dashboard", icon: CreditCard }, // Tab in main dashboard
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check theme
    const saved = localStorage.getItem("theme");
    const prefersDark = saved === "dark";
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);

    // Get provider info from localStorage
    const providerData = localStorage.getItem("apiclaw_provider");
    if (providerData) {
      try {
        const parsed = JSON.parse(providerData);
        setProviderName(parsed.name || parsed.email || "Provider");
      } catch {
        setProviderName("Provider");
      }
    }
    setIsLoading(false);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleLogout = () => {
    localStorage.removeItem("apiclaw_session");
    localStorage.removeItem("apiclaw_provider");
    router.push("/providers/dashboard/login");
  };

  // Check if current route is API detail page
  const apiIdMatch = pathname.match(/\/providers\/dashboard\/([^/]+)/);
  const currentApiId = apiIdMatch ? apiIdMatch[1] : null;
  const isApiDetailPage = currentApiId && currentApiId !== "login" && currentApiId !== "verify";

  // Don't show layout for login/verify pages
  if (pathname.includes("/login") || pathname.includes("/verify")) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-surface transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-lg">
              🦞
            </div>
            <span className="font-bold">APIClaw</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface transition"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface-elevated border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
                🦞
              </div>
              <span className="font-bold text-lg">APIClaw</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Provider info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm text-text-muted">Logged in as</p>
            <p className="font-medium truncate">{providerName || "Provider"}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/providers/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                pathname === "/providers/dashboard"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            {isApiDetailPage && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Current API
                  </p>
                </div>
                <Link
                  href={`/providers/dashboard/${currentApiId}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    pathname === `/providers/dashboard/${currentApiId}`
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Zap className="w-5 h-5" />
                  <span>Overview</span>
                </Link>
                <Link
                  href={`/providers/dashboard/${currentApiId}/direct-call`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    pathname.includes("/direct-call")
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>Direct Call</span>
                </Link>
                <Link
                  href={`/providers/dashboard/${currentApiId}/actions`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    pathname.includes("/actions")
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings className="w-5 h-5" />
                  <span>Actions</span>
                </Link>
                <Link
                  href={`/providers/dashboard/${currentApiId}/test`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    pathname.includes("/test")
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Test Console</span>
                </Link>
              </>
            )}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={toggleTheme}
              className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface hover:text-red-500 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        {/* Desktop header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isApiDetailPage && (
              <Link
                href="/providers/dashboard"
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            )}
            {!isApiDetailPage && (
              <h1 className="text-xl font-bold">Provider Dashboard</h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/providers/register" className="btn-secondary !py-2 !px-4 text-sm">
              <Zap className="w-4 h-4" />
              Add API
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
