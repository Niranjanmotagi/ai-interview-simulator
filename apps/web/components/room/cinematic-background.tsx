'use client';

/**
 * Atmospheric, self-contained "Japanese mountain dawn" backdrop — layered SVG
 * silhouettes + fog gradients, no external/copyrighted image. Heavy dark overlay
 * keeps foreground content readable, per the design spec. Drop in a licensed
 * photo by setting NEXT_PUBLIC_ROOM_BG_URL.
 */
const PHOTO = process.env.NEXT_PUBLIC_ROOM_BG_URL;

export function CinematicBackground({ dim = 0.8 }: { dim?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0A0A0A]">
      {PHOTO ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PHOTO})`, filter: 'blur(2px)' }}
        />
      ) : (
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b1320" />
              <stop offset="45%" stopColor="#11141d" />
              <stop offset="100%" stopColor="#0A0A0A" />
            </linearGradient>
            <radialGradient id="dawn" cx="50%" cy="62%" r="40%">
              <stop offset="0%" stopColor="#3a2f3f" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          <rect width="1440" height="900" fill="url(#sky)" />
          <rect width="1440" height="900" fill="url(#dawn)" />
          {/* sun disc, very subdued */}
          <circle cx="720" cy="560" r="120" fill="#6b5566" opacity="0.18" />

          {/* mountain ridges, far → near, cooler/darker as they approach */}
          <path d="M0 640 L240 470 L470 600 L700 430 L960 610 L1200 480 L1440 600 L1440 900 L0 900 Z" fill="#1a2230" opacity="0.55" />
          <path d="M0 720 L300 560 L560 690 L820 540 L1080 700 L1300 580 L1440 680 L1440 900 L0 900 Z" fill="#141a26" opacity="0.8" />
          <path d="M0 800 L260 690 L520 780 L760 660 L1020 790 L1280 700 L1440 780 L1440 900 L0 900 Z" fill="#0e131c" />

          <rect width="1440" height="900" fill="url(#fog)" />
        </svg>
      )}
      {/* readability overlay + subtle grain via radial vignette */}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim})` }} />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(0,0,0,0.7) 100%)' }}
      />
    </div>
  );
}
