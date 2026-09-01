import { memo } from "react";

export default memo(function KhmerSanctuaryBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#FAF7F2] dark:bg-[#090705] transition-colors duration-300">
      {/* 1. Full High-Definition Angkor Wat & Bayon Sanctuary Artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-45 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundImage: "url('/images/angkor-bayon-full-bg.png')",
        }}
        aria-hidden="true"
      />

      {/* 2. Light / Dark Vignette Scrim for Maximum Text Contrast */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/75 to-[#FAF7F2]/90 dark:from-[#090705]/85 dark:via-[#090705]/50 dark:to-[#090705]/75 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/90 via-transparent to-[#FAF7F2]/95 dark:from-[#090705]/60 dark:via-transparent dark:to-[#090705]/80 pointer-events-none"
        aria-hidden="true"
      />

      {/* 3. Golden Ambient Glow */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(212,175,55,0.06)_0%,transparent_75%)] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
});
