import cornerAsset from "../assets/1.png";
import crestAsset from "../assets/2.png";
import frameAsset from "../assets/3.png";
import medallionAsset from "../assets/4.png";
import nagaAsset from "../assets/5.png";
import monumentAsset from "../assets/6.png";
import spireAsset from "../assets/7.png";

/**
 * Royal Khmer Lotus Medallion Seal (Asset 4.png)
 */
export function KhmerLotusMedallion({ className = "h-8 w-8", glow = false }: { className?: string; glow?: boolean }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-gold/20 blur-md pointer-events-none" />
      )}
      <img
        src={medallionAsset}
        alt="Khmer Royal Lotus Seal"
        className="h-full w-full object-contain drop-shadow-[0_2px_10px_rgba(229,192,88,0.3)] relative z-10"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Royal Lotus Header Crest / Crown (Asset 2.png)
 */
export function KhmerLotusCrest({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={crestAsset}
        alt="Royal Khmer Lotus Crest"
        className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(229,192,88,0.25)]"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Traditional Kbach Corner Ornament (Asset 1.png)
 */
export function KhmerCornerOrnament({
  className = "w-6 h-6",
  position = "top-left",
}: {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  let rotationClass = "";
  if (position === "top-right") rotationClass = "scale-x-[-1]";
  if (position === "bottom-left") rotationClass = "scale-y-[-1]";
  if (position === "bottom-right") rotationClass = "scale-[-1]";

  return (
    <img
      src={cornerAsset}
      alt="Khmer Kbach Corner"
      className={`${className} ${rotationClass} object-contain pointer-events-none select-none`}
      loading="lazy"
    />
  );
}

/**
 * 4-Corner Kbach Framing for cards and containers
 */
export function KhmerCardCorners({
  size = "w-5 h-5",
  opacity = "opacity-40",
}: {
  size?: string;
  opacity?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${opacity}`}>
      <div className="absolute top-1.5 left-1.5">
        <KhmerCornerOrnament className={size} position="top-left" />
      </div>
      <div className="absolute top-1.5 right-1.5">
        <KhmerCornerOrnament className={size} position="top-right" />
      </div>
      <div className="absolute bottom-1.5 left-1.5">
        <KhmerCornerOrnament className={size} position="bottom-left" />
      </div>
      <div className="absolute bottom-1.5 right-1.5">
        <KhmerCornerOrnament className={size} position="bottom-right" />
      </div>
    </div>
  );
}

/**
 * Angkor Monument Silhouette Crest (Asset 6.png)
 */
export function KhmerMonumentBanner({ className = "h-24 w-auto" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={monumentAsset}
        alt="Angkor Monument Silhouette"
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Naga Pillar Guard (Asset 5.png)
 */
export function KhmerNagaPillar({ className = "h-32 w-auto" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={nagaAsset}
        alt="Khmer Naga Pillar"
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

/**
 * SVG fallback corner
 */
export function KbachCorner({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2 2 L38 2 C38 18 28 32 18 38 C18 26 12 18 2 18 L2 2 Z" fill="currentColor" opacity="0.75" />
      <circle cx="8" cy="8" r="2.5" fill="#0C0906" />
    </svg>
  );
}
