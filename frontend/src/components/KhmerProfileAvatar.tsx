import { memo } from "react";
import { cn } from "../lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface KhmerProfileAvatarProps {
  name?: string;
  avatar?: string | null;
  size?: AvatarSize;
  isAi?: boolean;
  isOnline?: boolean;
  role?: "admin" | "user" | "guest";
  showStatus?: boolean;
  showCrown?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CONFIGS: Record<
  AvatarSize,
  {
    container: string;
    avatarSize: string;
    innerSize: string;
    fontSize: string;
    kbachSize: string;
    statusSize: string;
  }
> = {
  xs: {
    container: "h-6 w-6",
    avatarSize: "h-6 w-6",
    innerSize: "h-5 w-5",
    fontSize: "text-[9px]",
    kbachSize: "h-7 w-7 -inset-0.5",
    statusSize: "h-2 w-2 ring-1",
  },
  sm: {
    container: "h-8 w-8",
    avatarSize: "h-8 w-8",
    innerSize: "h-7 w-7",
    fontSize: "text-[11px]",
    kbachSize: "h-9 w-9 -inset-0.5",
    statusSize: "h-2.5 w-2.5 ring-1.5",
  },
  md: {
    container: "h-10 w-10",
    avatarSize: "h-10 w-10",
    innerSize: "h-8.5 w-8.5",
    fontSize: "text-xs font-bold",
    kbachSize: "h-12 w-12 -inset-1",
    statusSize: "h-3 w-3 ring-2",
  },
  lg: {
    container: "h-14 w-14",
    avatarSize: "h-14 w-14",
    innerSize: "h-11.5 w-11.5",
    fontSize: "text-base font-extrabold",
    kbachSize: "h-16 w-16 -inset-1",
    statusSize: "h-3.5 w-3.5 ring-2",
  },
  xl: {
    container: "h-20 w-20",
    avatarSize: "h-20 w-20",
    innerSize: "h-16 w-16",
    fontSize: "text-xl font-extrabold",
    kbachSize: "h-24 w-24 -inset-2",
    statusSize: "h-4.5 w-4.5 ring-2",
  },
  "2xl": {
    container: "h-28 w-28",
    avatarSize: "h-28 w-28",
    innerSize: "h-22 w-22",
    fontSize: "text-2xl font-extrabold",
    kbachSize: "h-32 w-32 -inset-2",
    statusSize: "h-5 w-5 ring-2",
  },
};

/**
 * Royal Khmer Circular Profile Avatar Component
 * Framed with authentic gold filigree rings, tiered Kbach lotus petals, and radiant halo.
 */
export const KhmerProfileAvatar = memo(function KhmerProfileAvatar({
  name = "User",
  avatar,
  size = "md",
  isAi = false,
  isOnline = true,
  role = "user",
  showStatus = false,
  showCrown = false,
  glow = true,
  className,
  onClick,
}: KhmerProfileAvatarProps) {
  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  // Extract initials
  const initials = isAi
    ? "AI"
    : name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none group",
        cfg.container,
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* ── 1. Circular Golden Khmer Medallion Art Ring ── */}
      <div
        className={cn(
          "absolute pointer-events-none transition-transform duration-500",
          cfg.kbachSize,
          glow && "drop-shadow-[0_0_10px_rgba(212,175,55,0.45)] group-hover:drop-shadow-[0_0_16px_rgba(212,175,55,0.7)] group-hover:scale-105",
        )}
      >
        <img
          src="/images/khmer-assets/khmer-medallion-lotus-4.png"
          alt="Khmer Art Golden Frame"
          className="h-full w-full object-contain filter drop-shadow group-hover:rotate-12 transition-transform duration-700"
        />
      </div>

      {/* ── 2. Middle Layer: Outer Golden Beaded Tier Rim ── */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden transition-all duration-300 z-10",
          cfg.innerSize,
          "border-2 border-[#E5C058] ring-1 ring-[#7E5C05] shadow-lg shadow-black/80",
        )}
      >
        {isAi ? (
          /* Sastra AI Logo / Sacred Emblem */
          <div className="h-full w-full bg-gradient-to-br from-[#2A1F10] via-[#1A140A] to-[#0D0A06] p-1 flex items-center justify-center">
            <img
              src="/images/khmer-assets/khmer-medallion-lotus-4.png"
              alt="Sastra AI Avatar"
              className="h-full w-full object-contain filter drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]"
            />
          </div>
        ) : avatar ? (
          /* User Profile Photo */
          <img
            src={avatar}
            alt={name}
            className="h-full w-full object-cover rounded-full"
          />
        ) : (
          /* User Initials with Royal Khmer Golden Silk Texture */
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFF0C2] via-[#E5C058] to-[#996F15] text-[#1A1205] font-serif font-black tracking-tight shadow-inner">
            <span className={cn(cfg.fontSize, "drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]")}>
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* ── 3. Optional Royal Crown Accent for Admins ── */}
      {(showCrown || role === "admin") && (
        <span
          className="absolute -top-1.5 -right-1 z-20 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 text-[9px] shadow-md border border-gold"
          title="Royal Crown / Administrator"
        >
          👑
        </span>
      )}

      {/* ── 4. Optional Live Status Indicator (Emerald Jewel) ── */}
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 z-20 rounded-full border border-black/80 ring-black",
            cfg.statusSize,
            isOnline
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              : "bg-stone-500",
          )}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
});

export default KhmerProfileAvatar;
