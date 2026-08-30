import cornerAsset from "../assets/1.png";
import crestAsset from "../assets/2.png";
import frameAsset from "../assets/3.png";
import medallionAsset from "../assets/4.png";
import nagaPillarAsset from "../assets/5.png";
import monumentAsset from "../assets/6.png";
import spireAsset from "../assets/7.png";

export { cornerAsset, crestAsset, frameAsset, medallionAsset, nagaPillarAsset, monumentAsset, spireAsset };

/**
 * Royal Khmer Central Lotus Medallion Seal
 */
export function KhmerLotusMedallion({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src={medallionAsset}
      alt="Khmer Royal Medallion"
      className={`object-contain drop-shadow-[0_2px_12px_rgba(229,192,88,0.35)] select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
}

/**
 * Royal Khmer Crest / Header Crown Ornament
 */
export function KhmerLotusCrest({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <img
      src={crestAsset}
      alt="Khmer Royal Crest"
      className={`object-contain drop-shadow-[0_2px_10px_rgba(229,192,88,0.3)] select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
}

/**
 * Golden Kbach Corner Ornament
 */
export function KhmerCornerOrnament({
  position = "top-left",
  className = "w-6 h-6",
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const rotation = {
    "top-left": "",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  }[position];

  return (
    <img
      src={cornerAsset}
      alt="Khmer Corner Ornament"
      className={`object-contain drop-shadow-[0_1px_6px_rgba(229,192,88,0.25)] select-none pointer-events-none ${rotation} ${className}`}
      draggable={false}
    />
  );
}

/**
 * Angkor Monument Silhouette
 */
export function KhmerMonumentBanner({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <img
      src={monumentAsset}
      alt="Angkor Monument"
      className={`object-contain opacity-35 drop-shadow-[0_2px_15px_rgba(229,192,88,0.2)] select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
}

/**
 * Naga Pillar Guard Ornament
 */
export function KhmerNagaPillar({ className = "h-24 w-auto" }: { className?: string }) {
  return (
    <img
      src={nagaPillarAsset}
      alt="Khmer Naga Pillar"
      className={`object-contain opacity-40 select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
}

/**
 * Card with 4 ornate golden Khmer corners
 */
export function KhmerCardCorners({ size = "w-4 h-4 sm:w-5 sm:h-5", opacity = "opacity-75" }: { size?: string; opacity?: string }) {
  return (
    <>
      <div className={`absolute top-1.5 left-1.5 pointer-events-none ${opacity}`}>
        <KhmerCornerOrnament position="top-left" className={size} />
      </div>
      <div className={`absolute top-1.5 right-1.5 pointer-events-none ${opacity}`}>
        <KhmerCornerOrnament position="top-right" className={size} />
      </div>
      <div className={`absolute bottom-1.5 left-1.5 pointer-events-none ${opacity}`}>
        <KhmerCornerOrnament position="bottom-left" className={size} />
      </div>
      <div className={`absolute bottom-1.5 right-1.5 pointer-events-none ${opacity}`}>
        <KhmerCornerOrnament position="bottom-right" className={size} />
      </div>
    </>
  );
}

/**
 * SVG fallback corner
 */
export function KbachCorner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 38 L2 6 C2 3.79 3.79 2 6 2 L38 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 33 L7 11 C7 8.79 8.79 7 11 7 L33 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}

