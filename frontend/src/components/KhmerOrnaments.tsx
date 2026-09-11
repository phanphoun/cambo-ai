/**
 * Traditional Khmer Architectural & Art Vector Ornaments
 * Handcrafted SVG motifs inspired by Angkor Wat, Bayon temple carvings, 
 * Kbach Phka Chan (ក្បាច់ផ្កាចន្ទ), and lotus petal relief architecture (ស្រទាប់ផ្កាឈូក).
 */

/** The iconic 5-tower Angkor Wat silhouette */
export function AngkorWatSilhouette({ className = "h-12 w-auto", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 400 160" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Base Platform / Stepped Tier */}
      <rect x="10" y="145" width="380" height="8" rx="2" opacity="0.8" />
      <rect x="25" y="135" width="350" height="10" rx="2" opacity="0.85" />
      <rect x="45" y="122" width="310" height="13" rx="2" opacity="0.9" />
      
      {/* Central Grand Tower (Prasat Thom) */}
      <path d="M 195 10 C 196 5, 204 5, 205 10 L 208 30 C 212 33, 218 42, 216 55 L 222 57 C 226 62, 228 75, 224 88 L 230 92 C 235 100, 234 114, 228 122 L 172 122 C 166 114, 165 100, 170 92 L 176 88 C 172 75, 174 62, 178 57 L 184 55 C 182 42, 188 33, 192 30 Z" />
      <polygon points="200,0 197,8 203,8" />

      {/* Inner Left Tower */}
      <path d="M 145 35 C 146 30, 154 30, 155 35 L 157 50 C 160 53, 165 60, 163 70 L 168 73 C 171 78, 172 87, 168 96 L 172 99 C 175 105, 173 114, 168 122 L 132 122 C 127 114, 125 105, 128 99 L 132 96 C 128 87, 129 78, 132 73 L 137 70 C 135 60, 140 53, 143 50 Z" />
      <polygon points="150,26 148,34 152,34" />

      {/* Inner Right Tower */}
      <path d="M 245 35 C 246 30, 254 30, 255 35 L 257 50 C 260 53, 265 60, 263 70 L 268 73 C 271 78, 272 87, 268 96 L 272 99 C 275 105, 273 114, 268 122 L 232 122 C 227 114, 225 105, 228 99 L 232 96 C 228 87, 229 78, 232 73 L 237 70 C 235 60, 240 53, 243 50 Z" />
      <polygon points="250,26 248,34 252,34" />

      {/* Outer Left Tower */}
      <path d="M 95 60 C 96 55, 104 55, 105 60 L 107 72 C 110 75, 114 80, 112 88 L 116 90 C 119 95, 119 102, 116 109 L 118 111 C 121 115, 120 120, 116 122 L 84 122 C 80 120, 79 115, 82 111 L 84 109 C 81 102, 81 95, 84 90 L 88 88 C 86 80, 90 75, 93 72 Z" />
      <polygon points="100,52 98,59 102,59" />

      {/* Outer Right Tower */}
      <path d="M 295 60 C 296 55, 304 55, 305 60 L 307 72 C 310 75, 314 80, 312 88 L 316 90 C 319 95, 319 102, 316 109 L 318 111 C 321 115, 320 120, 316 122 L 284 122 C 280 120, 279 115, 282 111 L 284 109 C 281 102, 281 95, 284 90 L 288 88 C 286 80, 290 75, 293 72 Z" />
      <polygon points="300,52 298,59 302,59" />

      {/* Connecting Galleries & Pillars */}
      <rect x="55" y="112" width="290" height="10" rx="1" opacity="0.9" />
      <g opacity="0.6">
        <rect x="65" y="122" width="4" height="13" />
        <rect x="75" y="122" width="4" height="13" />
        <rect x="180" y="122" width="4" height="13" />
        <rect x="190" y="122" width="4" height="13" />
        <rect x="206" y="122" width="4" height="13" />
        <rect x="216" y="122" width="4" height="13" />
        <rect x="320" y="122" width="4" height="13" />
        <rect x="330" y="122" width="4" height="13" />
      </g>
    </svg>
  );
}

/** Traditional Kbach Lotus Motif (ក្បាច់ផ្កាឈូកខ្មែរ) */
export function KbachLotus({ className = "h-6 w-6", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Central Lotus Bud */}
      <path d="M 50 10 C 44 28, 38 45, 50 65 C 62 45, 56 28, 50 10 Z" />
      {/* Left Inner Petal */}
      <path d="M 50 65 C 32 60, 24 40, 30 25 C 24 42, 35 58, 50 65 Z" />
      {/* Right Inner Petal */}
      <path d="M 50 65 C 68 60, 76 40, 70 25 C 76 42, 65 58, 50 65 Z" />
      {/* Left Outer Flame Petal */}
      <path d="M 50 75 C 20 72, 10 50, 15 35 C 8 55, 25 74, 50 75 Z" opacity="0.85" />
      {/* Right Outer Flame Petal */}
      <path d="M 50 75 C 80 72, 90 50, 85 35 C 92 55, 75 74, 50 75 Z" opacity="0.85" />
      {/* Base Calyx */}
      <path d="M 35 78 C 45 88, 55 88, 65 78 C 58 84, 42 84, 35 78 Z" />
      <circle cx="50" cy="90" r="3" />
    </svg>
  );
}

/** Traditional Kbach Corner Border (ក្បាច់កាច់ជ្រុងប្រាសាទ) */
export function KbachCorner({ className = "h-8 w-8", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 50 50" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M 2 2 L 2 28 C 4 24, 8 20, 14 18 C 10 14, 14 8, 20 6 C 24 4, 30 4, 34 2 Z" />
      <path d="M 2 2 L 28 2 C 24 4, 20 8, 18 14 C 14 10, 8 14, 6 20 C 4 24, 4 30, 2 34 Z" opacity="0.75" />
      <circle cx="6" cy="6" r="2" />
    </svg>
  );
}

/** Intricate Sacred Khmer Lotus Medallion (ក្បាច់ផ្កាឈូកមាសបុរាណ) in High-Res SVG */
export function KhmerLotusMedallion({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="45%" stopColor="#E5C058" />
          <stop offset="75%" stopColor="#B3861B" />
          <stop offset="100%" stopColor="#5E430B" />
        </radialGradient>
        <linearGradient id="bronzeFrame" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A5818" />
          <stop offset="50%" stopColor="#3A270B" />
          <stop offset="100%" stopColor="#1E1405" />
        </linearGradient>
      </defs>

      {/* Outer Bronze Medallion Rim */}
      <circle cx="60" cy="60" r="56" fill="url(#bronzeFrame)" stroke="#D4AF37" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="51" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
      
      {/* 16 Radiating Sacred Sunburst Rays */}
      <g stroke="#E5C058" strokeWidth="1.2" opacity="0.6">
        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle, i) => (
          <line
            key={i}
            x1="60"
            y1="60"
            x2={60 + 47 * Math.cos((angle * Math.PI) / 180)}
            y2={60 + 47 * Math.sin((angle * Math.PI) / 180)}
          />
        ))}
      </g>

      {/* Layer 1 Outer Lotus Petals */}
      <g fill="url(#goldGradient)" stroke="#5E430B" strokeWidth="0.8" opacity="0.9">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <path
            key={i}
            d="M 60 60 C 50 35, 55 20, 60 15 C 65 20, 70 35, 60 60 Z"
            transform={`rotate(${angle} 60 60)`}
          />
        ))}
      </g>

      {/* Layer 2 Inner Lotus Petals */}
      <g fill="url(#goldGradient)" stroke="#5E430B" strokeWidth="0.8">
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
          <path
            key={i}
            d="M 60 60 C 53 40, 56 28, 60 22 C 64 28, 67 40, 60 60 Z"
            transform={`rotate(${angle} 60 60)`}
          />
        ))}
      </g>

      {/* Central Core Calyx */}
      <circle cx="60" cy="60" r="14" fill="#D4AF37" stroke="#5E430B" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="8" fill="#FFF2A3" />
      <circle cx="60" cy="60" r="3" fill="#8B0000" />
    </svg>
  );
}

/** Khmer Temple Gate / Pediment Silhouette (ហោជាងប្រាសាទខ្មែរ) */
export function KhmerPediment({ className = "h-8 w-auto", stroke = "currentColor" }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 200 40" fill="none" stroke={stroke} strokeWidth="1.5" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Curved Gable Roof Ridge */}
      <path d="M 10 35 C 30 25, 60 12, 100 5 C 140 12, 170 25, 190 35" />
      {/* Left Naga Flame Finial */}
      <path d="M 10 35 C 6 32, 4 25, 8 20 C 12 24, 15 30, 18 34" />
      {/* Right Naga Flame Finial */}
      <path d="M 190 35 C 194 32, 196 25, 192 20 C 188 24, 185 30, 182 34" />
      {/* Center Pinnacle */}
      <path d="M 100 5 L 100 0" strokeWidth="2" />
      <circle cx="100" cy="0" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Sacred Sastra Palm-Leaf Manuscript & Golden Book Icon (សាស្ត្រាស្លឹករឹត) */
export function KhmerSastraBookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bookGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="35%" stopColor="#E5C058" />
          <stop offset="70%" stopColor="#C99824" />
          <stop offset="100%" stopColor="#7A530B" />
        </linearGradient>
        <linearGradient id="pageGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBE6" />
          <stop offset="100%" stopColor="#D9B048" />
        </linearGradient>
      </defs>
      
      {/* Back Cover & Gold Rim */}
      <path
        d="M 6 36 C 14 33, 22 35, 24 38 C 26 35, 34 33, 42 36 L 42 12 C 34 9, 26 11, 24 14 C 22 11, 14 9, 6 12 Z"
        fill="#261A08"
        stroke="url(#bookGold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Page Glow */}
      <path
        d="M 6 34 C 14 31, 22 33, 24 36 C 26 33, 34 31, 42 34 L 42 10 C 34 7, 26 9, 24 12 C 22 9, 14 7, 6 10 Z"
        fill="url(#pageGlow)"
        opacity="0.9"
      />
      
      {/* Left Page Inscription Lines */}
      <path d="M 10 16 C 14 15, 18 16, 21 17" stroke="#7A530B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 10 21 C 14 20, 18 21, 21 22" stroke="#7A530B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 10 26 C 14 25, 18 26, 21 27" stroke="#7A530B" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Right Page Inscription Lines */}
      <path d="M 27 17 C 30 16, 34 15, 38 16" stroke="#7A530B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 27 22 C 30 21, 34 20, 38 21" stroke="#7A530B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 27 27 C 30 26, 34 25, 38 26" stroke="#7A530B" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Center Spine & Bookmark Ribbon */}
      <path d="M 24 12 L 24 38" stroke="url(#bookGold)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 24 36 L 24 43 L 26.5 41 L 29 43 L 29 36" fill="url(#bookGold)" />
      
      {/* Radiant Top Sparkle of Knowledge */}
      <circle cx="24" cy="7" r="1.8" fill="#FFF4B8" />
      <path d="M 24 3 L 24 11 M 20 7 L 28 7" stroke="#FFF4B8" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/** Golden 3-Tower Angkor Wat Crest (ត្រាប្រាសាទអង្គរវត្តមាស) */
export function KhmerAngkorCrest({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="angkorGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="40%" stopColor="#E5C058" />
          <stop offset="80%" stopColor="#B3861B" />
          <stop offset="100%" stopColor="#6E4A0C" />
        </linearGradient>
      </defs>
      {/* Tiered base */}
      <path d="M 6 56 L 58 56 L 54 52 L 10 52 Z" fill="url(#angkorGold)" opacity="0.9" />
      <path d="M 12 51 L 52 51 L 49 47 L 15 47 Z" fill="url(#angkorGold)" opacity="0.95" />
      {/* Center Main Spire */}
      <path
        d="M 32 6 C 33 10, 35 15, 37 20 L 39 26 C 41 32, 40 38, 41 46 L 23 46 C 24 38, 23 32, 25 26 L 27 20 C 29 15, 31 10, 32 6 Z"
        fill="url(#angkorGold)"
      />
      <polygon points="32,2 30,7 34,7" fill="#FFF2A3" />
      {/* Left Tower */}
      <path
        d="M 20 18 C 21 22, 22 26, 24 30 L 25 36 C 26 40, 25 43, 26 46 L 14 46 C 15 43, 14 40, 15 36 L 16 30 C 18 26, 19 22, 20 18 Z"
        fill="url(#angkorGold)"
        opacity="0.9"
      />
      <polygon points="20,15 18,19 22,19" fill="#FFF2A3" />
      {/* Right Tower */}
      <path
        d="M 44 18 C 45 22, 46 26, 48 30 L 49 36 C 50 40, 49 43, 50 46 L 38 46 C 39 43, 38 40, 39 36 L 40 30 C 42 26, 43 22, 44 18 Z"
        fill="url(#angkorGold)"
        opacity="0.9"
      />
      <polygon points="44,15 42,19 46,19" fill="#FFF2A3" />
      {/* Spire horizontal architectural relief grooves */}
      <line x1="28" y1="22" x2="36" y2="22" stroke="#4A3205" strokeWidth="1" />
      <line x1="26" y1="30" x2="38" y2="30" stroke="#4A3205" strokeWidth="1" />
      <line x1="24" y1="38" x2="40" y2="38" stroke="#4A3205" strokeWidth="1" />
    </svg>
  );
}

/** Golden Kbach Ornate Corner Border Frame */
export function KhmerGoldenFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border border-amber-600/40 bg-gradient-to-r from-[#17130E] via-[#20180F] to-[#120E0A] p-4 sm:p-5 shadow-xl shadow-black/60 overflow-hidden ${className}`}>
      {/* Corner Ornaments */}
      <div className="absolute top-1.5 left-1.5 text-gold/70 pointer-events-none">
        <KbachCorner className="h-4 w-4" />
      </div>
      <div className="absolute top-1.5 right-1.5 rotate-90 text-gold/70 pointer-events-none">
        <KbachCorner className="h-4 w-4" />
      </div>
      <div className="absolute bottom-1.5 left-1.5 -rotate-90 text-gold/70 pointer-events-none">
        <KbachCorner className="h-4 w-4" />
      </div>
      <div className="absolute bottom-1.5 right-1.5 rotate-180 text-gold/70 pointer-events-none">
        <KbachCorner className="h-4 w-4" />
      </div>
      {children}
    </div>
  );
}

/**
 * Authentic Khmer Lintel Corner Kbach (ក្បាច់កាច់ជ្រុងបន្ទាយស្រី)
 * Handcrafted vector ornament for framing rectangular containers, input boxes, and royal cards.
 */
export function KhmerInputCorner({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cornerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="45%" stopColor="#E5C058" />
          <stop offset="85%" stopColor="#B3861B" />
          <stop offset="100%" stopColor="#664608" />
        </linearGradient>
      </defs>
      {/* Outer corner framing border lines */}
      <path
        d="M 3 32 L 3 10 C 3 6.13 6.13 3 10 3 L 32 3"
        stroke="url(#cornerGoldGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Inner hairline frame accent */}
      <path
        d="M 7 26 L 7 12 C 7 9.24 9.24 7 12 7 L 26 7"
        stroke="url(#cornerGoldGrad)"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Primary Kbach Phnhi Snail Scroll (ក្បាច់គូទខ្ចង) */}
      <path
        d="M 8 8 C 14 14, 18 16, 26 12 C 30 10, 31 6, 28 4 C 24 2, 19 8, 16 12 C 12 17, 10 24, 4 28 C 2 29, 2 24, 4 20 C 6 16, 8 12, 8 8 Z"
        fill="url(#cornerGoldGrad)"
        opacity="0.9"
      />
      {/* Lotus flame petal branch upward */}
      <path
        d="M 12 6 C 16 2, 22 2, 25 3 C 21 4, 18 6, 17 9 C 15 11, 14 8, 12 6 Z"
        fill="url(#cornerGoldGrad)"
      />
      {/* Lotus flame petal branch downward */}
      <path
        d="M 6 12 C 2 16, 2 22, 3 25 C 4 21, 6 18, 9 17 C 11 15, 8 14, 6 12 Z"
        fill="url(#cornerGoldGrad)"
      />
      {/* Center Sacred Bead (គ្រាប់អង្កាំមាស) */}
      <circle cx="10" cy="10" r="1.75" fill="#FFF8D6" stroke="#8A5E12" strokeWidth="0.5" />
      {/* Corner relief studs */}
      <circle cx="3" cy="36" r="1.2" fill="#E5C058" />
      <circle cx="36" cy="3" r="1.2" fill="#E5C058" />
    </svg>
  );
}

/**
 * Khmer Architectural Pediment Arch / Crest (ហោជាងប្រាសាទខ្មែរលម្អគែម)
 * Sits gently atop the center of the input container.
 */
export function KhmerBorderPediment({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pedimentGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="25%" stopColor="#D4AF37" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#FFF2A3" stopOpacity="1" />
          <stop offset="75%" stopColor="#D4AF37" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Flowing horizontal hairline with central arched pediment */}
      <path
        d="M 0 14 L 46 14 C 60 14, 68 8, 74 4 C 76 2, 78 1, 80 1 C 82 1, 84 2, 86 4 C 92 8, 100 14, 114 14 L 160 14"
        stroke="url(#pedimentGoldGrad)"
        strokeWidth="1.2"
      />
      {/* Central Sacred Lotus Bud Spire */}
      <path
        d="M 80 0 C 78 3, 76 6, 80 11 C 84 6, 82 3, 80 0 Z"
        fill="#FFF2A3"
      />
      {/* Flanking Naga Flame Whisps */}
      <path
        d="M 77 7 C 73 6, 70 9, 68 11 C 72 10, 75 10, 77 12 Z"
        fill="#D4AF37"
        opacity="0.9"
      />
      <path
        d="M 83 7 C 87 6, 90 9, 92 11 C 88 10, 85 10, 83 12 Z"
        fill="#D4AF37"
        opacity="0.9"
      />
      {/* Tiny Sacred Jewel Center */}
      <circle cx="80" cy="13.5" r="1.5" fill="#FFF4B8" />
    </svg>
  );
}

/**
 * Khmer Floral Rosette Divider Accent (ផ្កាចន្ទខណ្ឌបន្ទាត់)
 * Delicate traditional division ornament between input area and action tools.
 */
export function KhmerDividerAccent({ className = "h-2.5 w-auto text-gold/60" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 10"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="0" y1="5" x2="46" y2="5" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="74" y1="5" x2="120" y2="5" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      {/* Central 4-petal Kbach Phka Chan */}
      <path d="M 60 1 L 63 5 L 60 9 L 57 5 Z" fill="currentColor" opacity="0.95" />
      <circle cx="53" cy="5" r="1.2" fill="currentColor" opacity="0.7" />
      <circle cx="67" cy="5" r="1.2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
