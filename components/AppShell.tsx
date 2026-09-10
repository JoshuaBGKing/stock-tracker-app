"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Command,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import Brand from "@/components/Brand";
import SearchCommand from "@/components/SearchCommand";
import { AlertMonitor } from "@/components/AlertMonitor";
import { useWorkspace } from "@/components/WorkspaceProvider";
import type { ReaderUser } from "@/lib/market-types";
import { useHydrated } from "@/hooks/useHydrated";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/alerts", label: "Price alerts", icon: Bell },
  { href: "/news", label: "Market news", icon: BookOpen },
];
export function AppShell({
  user,
  children,
}: {
  user: ReaderUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const [menuOpen, setMenuOpen] = useState(false);
  const { stocks, alerts } = useWorkspace();
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const pageName =
    links.find((link) => link.href === pathname)?.label ||
    (pathname.startsWith("/stocks/")
      ? "Stock details"
      : pathname === "/learn"
        ? "Field guide"
        : "Settings");
  useEffect(() => {
    if (!menuOpen) return;
    const first = sidebar.current?.querySelector<HTMLAnchorElement>("a");
    first?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
      if (event.key === "Tab") {
        const elements =
          sidebar.current?.querySelectorAll<HTMLElement>("a, button");
        if (!elements?.length) return;
        const firstElement = elements[0],
          lastElement = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [menuOpen]);
  function closeMenu() {
    setMenuOpen(false);
    menuButton.current?.focus();
  }
  return (
    <>
      <noscript>
        <p className="test-mode-banner">
          This interactive workspace requires JavaScript. You can still read the{" "}
          <a href="/privacy">privacy policy</a>, <a href="/terms">terms</a>, and{" "}
          <a href="/accessibility">accessibility information</a>.
        </p>
      </noscript>
      <div
        inert={!hydrated}
        aria-busy={!hydrated}
        data-workspace-ready={hydrated}
      >
        <AlertMonitor />
        {menuOpen && (
          <button
            className="sidebar-scrim"
            aria-label="Close navigation"
            onClick={closeMenu}
            tabIndex={-1}
          />
        )}
        <aside
          className={`app-sidebar ${menuOpen ? "is-open" : ""}`}
          ref={sidebar}
          aria-label="Main navigation"
        >
          <Brand />
          <p className="sidebar-label">Your workspace</p>
          <nav className="side-nav" aria-label="Workspace">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={pathname === href ? "active" : ""}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
                {label}
                {href === "/watchlist" && stocks.length > 0 && (
                  <span className="nav-count">{stocks.length}</span>
                )}
                {href === "/alerts" &&
                  alerts.filter((item) => !item.triggeredAt).length > 0 && (
                    <span className="nav-count">
                      {alerts.filter((item) => !item.triggeredAt).length}
                    </span>
                  )}
              </Link>
            ))}
          </nav>
          <p className="sidebar-label">The bigger picture</p>
          <nav className="side-nav" aria-label="Resources">
            <Link
              href="/learn"
              onClick={() => setMenuOpen(false)}
              className={pathname === "/learn" ? "active" : ""}
              aria-current={pathname === "/learn" ? "page" : undefined}
            >
              <CircleHelp size={17} strokeWidth={1.6} aria-hidden="true" />
              Field guide
            </Link>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className={pathname === "/settings" ? "active" : ""}
              aria-current={pathname === "/settings" ? "page" : undefined}
            >
              <Settings2 size={17} strokeWidth={1.6} aria-hidden="true" />
              Settings & privacy
            </Link>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <ShieldCheck size={22} strokeWidth={1.3} aria-hidden="true" />
              <h3>
                Your market.
                <br />
                Your space.
              </h3>
              <p>
                No ad trackers. No noise.
                <br />
                Just a little more perspective.
              </p>
              <Link href="/privacy">
                Our approach to privacy{" "}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <Link
              href={user ? "/settings" : "/sign-in"}
              className="profile-link"
            >
              <span className="avatar-circle">
                {user ? (
                  user.name.slice(0, 1).toUpperCase()
                ) : (
                  <Command size={15} aria-hidden="true" />
                )}
              </span>
              <span>
                <strong>{user?.name || "Your personal space"}</strong>
                <small>
                  {user ? "Account settings" : "Sign in to sync your watchlist"}
                </small>
              </span>
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {menuOpen && (
            <button className="button mobile-menu" onClick={closeMenu}>
              <X size={16} aria-hidden="true" />
              Close menu
            </button>
          )}
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="mobile-brand">
              <Brand />
            </div>
            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={11} aria-hidden="true" />
              <strong>{pageName}</strong>
            </div>
            <div className="topbar-actions">
              <SearchCommand label="Search anything..." shortcut />
              <Link
                className="icon-button"
                href="/alerts"
                aria-label="View price alerts"
              >
                <Bell size={16} strokeWidth={1.6} aria-hidden="true" />
              </Link>
              <button
                ref={menuButton}
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={19} aria-hidden="true" />
              </button>
            </div>
          </header>
          <main id="main-content" tabIndex={-1} className="page-content">
            {children}
          </main>
          <footer className="app-footer">
            <span>
              © {new Date().getFullYear()} Stillmark. A little perspective.
            </span>
            <div className="footer-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/settings">Privacy choices</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
