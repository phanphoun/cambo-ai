import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
  Share2,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { toggleTheme } from "../features/theme/themeSlice";
import ShareMenu from "../features/share/ShareMenu";
import type { RootState } from "../store";

interface TopbarProps {
  onMenu: () => void;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
  backendOnline: boolean;
}

export default function Topbar({
  onMenu,
  onToggleSidebar,
  sidebarVisible,
  backendOnline: _backendOnline,
}: TopbarProps) {
  const dispatch = useDispatch();
  const currentTheme = useSelector((s: RootState) => s.theme.current);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navLinks = [
    { href: "#home", en: "Home", km: "ទំព័រដើម" },
    { href: "#features", en: "Features", km: "ជម្រើស" },
    { href: "#about", en: "About", km: "អំពី" },
    { href: "#contact", en: "Contact", km: "ទំនាក់ទំនង" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        solid
          ? "bg-charcoal/95 shadow-lg border-gold/10"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson text-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="6" r="3" />
              <path d="M12 9v6" />
              <path d="M8 15c0 2 4 4 4 4s4-2 4-4" />
              <path d="M6 21c0-3 3-5 6-5s6 2 6 5" />
              <path d="M9 12l-2-2M15 12l2-2" />
            </svg>
          </span>
          <span className="text-lg font-bold text-gold">Cambo AI</span>
        </a>

        {/* Desktop menu */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group flex flex-col text-sm font-medium text-gray-300 transition-colors hover:text-gold"
            >
              <span>{item.en}</span>
              <span className="font-khmer text-[10px] text-gray-400 transition-colors group-hover:text-gold/80">
                {item.km}
              </span>
            </a>
          ))}
        </div>

        {/* Right: CTA + controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#"
            className="hidden md:inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold via-yellow-300 to-gold px-4 py-2 text-sm font-semibold text-charcoal transition-transform hover:-translate-y-0.5"
          >
            Try Now
          </a>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden md:inline-flex h-8 w-8"
            aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            title={`${sidebarVisible ? "Hide" : "Show"} sidebar (Ctrl+B)`}
          >
            <span className="text-lg">☰</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onMenu}
            className="h-8 w-8 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleTheme())}
            className="hidden md:flex h-8 w-8"
            aria-label={currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {currentTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-foreground/70" />
            )}
          </Button>

          <div className="relative hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShareOpen(!shareOpen)}
              className="h-8 w-8"
              aria-label="Share conversation"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <ShareMenu open={shareOpen} onClose={() => setShareOpen(false)} />
          </div>

          {/* Mobile CTA in topbar */}
          <a
            href="#"
            className="md:hidden inline-flex items-center rounded-lg bg-gradient-to-r from-gold via-yellow-300 to-gold px-3 py-1.5 text-xs font-semibold text-charcoal"
          >
            Try Now
          </a>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-charcoal/95 border-l border-gold/10 shadow-2xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Mobile menu"
      >
        <div className="flex flex-col gap-1 p-4 pt-16">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex flex-col rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-gold"
            >
              <span>{item.en}</span>
              <span className="font-khmer text-xs text-gray-400">{item.km}</span>
            </a>
          ))}

          <div className="mt-4 border-t border-gold/10 pt-4">
            <a
              href="#"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-gold via-yellow-300 to-gold px-4 py-2.5 text-sm font-semibold text-charcoal"
            >
              Try Now
            </a>
          </div>
        </div>
      </aside>
    </header>
  );
}
