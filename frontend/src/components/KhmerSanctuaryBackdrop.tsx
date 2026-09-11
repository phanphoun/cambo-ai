import { memo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { getBackgroundById } from "../data/backgrounds";

// 14 Sacred Golden Ambient Fireflies / Divine Light Motes
const SACRED_LIGHT_MOTES = [
  { id: 1, left: "11%", size: 3.2, duration: 20, delay: 0 },
  { id: 2, left: "21%", size: 4.0, duration: 24, delay: 4 },
  { id: 3, left: "32%", size: 2.5, duration: 18, delay: 8 },
  { id: 4, left: "44%", size: 3.8, duration: 26, delay: 2 },
  { id: 5, left: "53%", size: 2.2, duration: 21, delay: 10 },
  { id: 6, left: "64%", size: 4.2, duration: 22, delay: 5 },
  { id: 7, left: "76%", size: 3.0, duration: 25, delay: 12 },
  { id: 8, left: "87%", size: 2.8, duration: 19, delay: 7 },
  { id: 9, left: "16%", size: 3.4, duration: 23, delay: 14 },
  { id: 10, left: "49%", size: 4.5, duration: 27, delay: 1 },
  { id: 11, left: "60%", size: 2.6, duration: 20, delay: 16 },
  { id: 12, left: "81%", size: 3.6, duration: 24, delay: 9 },
  { id: 13, left: "27%", size: 2.4, duration: 19, delay: 13 },
  { id: 14, left: "71%", size: 3.2, duration: 28, delay: 6 },
];

export default memo(function KhmerSanctuaryBackdrop() {
  const { backgroundId, backgroundOpacity, current: currentTheme } = useSelector(
    (s: RootState) => s.theme
  );
  const currentBg = getBackgroundById(backgroundId);

  // Compute responsive opacity based on theme & user preference
  const effectiveOpacity =
    currentTheme === "dark" ? backgroundOpacity : backgroundOpacity * 0.6;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#FAF7F2] dark:bg-[#090705] transition-colors duration-500">
      {/* ── Keyframe Animations for Living Organic Sanctuary ── */}
      <style>{`
        @keyframes sanctuary-breathe {
          0% {
            transform: scale(1.0) translate3d(0, 0, 0);
          }
          50% {
            transform: scale(1.035) translate3d(-0.4%, -0.5%, 0);
          }
          100% {
            transform: scale(1.012) translate3d(0.3%, 0.2%, 0);
          }
        }

        @keyframes lake-mist-drift {
          0% {
            transform: translate3d(-4%, 0, 0) scaleY(1.0);
            opacity: 0.22;
          }
          50% {
            transform: translate3d(3%, -1%, 0) scaleY(1.15);
            opacity: 0.42;
          }
          100% {
            transform: translate3d(-2%, 0.8%, 0) scaleY(0.96);
            opacity: 0.28;
          }
        }

        @keyframes sacred-mote-rise {
          0% {
            transform: translate3d(0, 105vh, 0) scale(0.6);
            opacity: 0;
          }
          12% {
            opacity: 0.85;
          }
          50% {
            transform: translate3d(24px, 52vh, 0) scale(1.15);
            opacity: 0.95;
          }
          82% {
            opacity: 0.65;
          }
          100% {
            transform: translate3d(-18px, -8vh, 0) scale(0.75);
            opacity: 0;
          }
        }

        @keyframes celestial-sun-pulse {
          0%, 100% {
            opacity: 0.28;
            transform: scale(1.0);
          }
          50% {
            opacity: 0.55;
            transform: scale(1.08);
          }
        }

        @keyframes water-surface-shimmer {
          0%, 100% {
            opacity: 0.12;
            transform: scaleX(0.96) translate3d(0, 0, 0);
          }
          50% {
            opacity: 0.32;
            transform: scaleX(1.04) translate3d(1%, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .living-backdrop-layer {
            animation: none !important;
          }
        }
      `}</style>

      {/* 1. Full High-Definition Living Sanctuary Background Artwork (Subtle Organic Breathing) */}
      <div
        key={currentBg.id}
        className="living-backdrop-layer absolute inset-[-24px] bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-700 ease-in-out"
        style={{
          backgroundImage: `url("${currentBg.src}")`,
          opacity: effectiveOpacity,
          animation: "sanctuary-breathe 32s ease-in-out infinite alternate",
          willChange: "transform",
        }}
        aria-hidden="true"
      />

      {/* 2. Atmospheric Sanctuary Lake Mist (Drifting Gently across Lotus Waters) */}
      <div
        className="living-backdrop-layer absolute inset-x-[-12%] top-[38%] h-[36%] pointer-events-none mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 50%, rgba(212, 175, 55, 0.13) 0%, rgba(255, 248, 220, 0.05) 50%, transparent 80%)",
          animation: "lake-mist-drift 38s ease-in-out infinite alternate",
          willChange: "transform, opacity",
        }}
        aria-hidden="true"
      />

      {/* 3. Celestial Angkor Sunbeam & Golden Auroral Shimmer */}
      <div
        className="living-backdrop-layer absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 48% at 50% 36%, rgba(212, 175, 55, 0.08) 0%, rgba(245, 208, 97, 0.03) 45%, transparent 75%)",
          animation: "celestial-sun-pulse 14s ease-in-out infinite",
          willChange: "opacity, transform",
        }}
        aria-hidden="true"
      />

      {/* 4. Lotus Lake Surface Shimmer (Lower Third Water Glimmer) */}
      <div
        className="living-backdrop-layer absolute inset-x-0 bottom-[12%] h-[20%] pointer-events-none mix-blend-overlay"
        style={{
          background:
            "radial-gradient(ellipse 75% 35% at 50% 50%, rgba(245, 208, 97, 0.14) 0%, transparent 72%)",
          animation: "water-surface-shimmer 9s ease-in-out infinite alternate",
          willChange: "opacity, transform",
        }}
        aria-hidden="true"
      />

      {/* 5. Sacred Golden Ambient Fireflies / Divine Light Motes Drifting Upward */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {SACRED_LIGHT_MOTES.map((mote) => (
          <div
            key={mote.id}
            className="living-backdrop-layer absolute rounded-full pointer-events-none"
            style={{
              left: mote.left,
              bottom: "-25px",
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              backgroundColor: "#FCE588",
              boxShadow: `0 0 ${mote.size * 2.8}px ${mote.size * 1.2}px rgba(212, 175, 55, 0.85)`,
              animation: `sacred-mote-rise ${mote.duration}s cubic-bezier(0.38, 0, 0.22, 1) infinite`,
              animationDelay: `${mote.delay}s`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* 6. Balanced Ambient Scrim: Clear on Left/Right Edges with Readable Center */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/30 via-[#FAF7F2]/55 to-[#FAF7F2]/30 dark:from-[#090705]/20 via-[#090705]/42 dark:to-[#090705]/20 pointer-events-none transition-opacity duration-500"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/55 via-transparent to-[#FAF7F2]/70 dark:from-[#090705]/35 dark:via-transparent dark:to-[#090705]/55 pointer-events-none"
        aria-hidden="true"
      />

      {/* 7. Golden Vignette Perimeter Framing */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_48%,rgba(212,175,55,0.03)_0%,transparent_85%)] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
});
