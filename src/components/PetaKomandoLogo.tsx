import React from 'react';

interface PetaKomandoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showText?: boolean;
}

export default function PetaKomandoLogo({
  className = '',
  size = 'lg',
  showText = true,
}: PetaKomandoLogoProps) {
  // Max width mapping based on size
  const maxWidthClass = {
    sm: 'max-w-[280px]',
    md: 'max-w-[420px]',
    lg: 'max-w-[540px]',
    xl: 'max-w-[600px]',
    full: 'max-w-full',
  }[size];

  return (
    <div className={`w-full ${maxWidthClass} select-none mx-auto ${className}`}>
      <svg
        viewBox="0 0 600 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto aspect-[3/1] block drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id="cyberGridBg" x1="0" y1="0" x2="600" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#080e1a" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>

          {/* Cyan Glow */}
          <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Orange Glow */}
          <linearGradient id="orangeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* Green Glow */}
          <linearGradient id="greenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          {/* Text Cyan Gradient */}
          <linearGradient id="textCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00B4D8" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Background Plate for 600x200 canvas */}
        <rect width="600" height="200" rx="16" fill="url(#cyberGridBg)" stroke="#1e293b" strokeWidth="1.5" />

        {/* Cyber Grid Lines (600x200 grid) */}
        <g opacity="0.22" stroke="#38bdf8" strokeWidth="0.8">
          <line x1="0" y1="40" x2="600" y2="40" />
          <line x1="0" y1="100" x2="600" y2="100" />
          <line x1="0" y1="160" x2="600" y2="160" />
          <line x1="65" y1="0" x2="65" y2="200" />
          <line x1="130" y1="0" x2="130" y2="200" />
          <line x1="195" y1="0" x2="195" y2="200" />
          <line x1="260" y1="0" x2="260" y2="200" />
          <line x1="325" y1="0" x2="325" y2="200" />
          <line x1="390" y1="0" x2="390" y2="200" />
          <line x1="455" y1="0" x2="455" y2="200" />
          <line x1="520" y1="0" x2="520" y2="200" />
        </g>

        {/* ========================================================================= */}
        {/* EMBLEM / ICON LOGO (LEFT CENTER: cx=115, cy=100)                          */}
        {/* ========================================================================= */}
        <g id="kp-emblem" transform="translate(115, 100)">
          {/* Radiating Ambient Glow Ring */}
          <circle cx="0" cy="0" r="70" fill="#0284c7" opacity="0.12" filter="url(#neonGlow)" />
          
          {/* Outer Circuit Nodes & Traces (Top / Left / Right / Bottom) */}
          <g filter="url(#softGlow)">
            {/* Top Cyan Rays */}
            <path d="M 0 -45 L 0 -72" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="-75" r="4" fill="#38bdf8" />
            
            <path d="M -15 -42 L -25 -63 L -38 -70" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="-40" cy="-71" r="3.5" fill="#4ade80" />

            <path d="M 15 -42 L 25 -63 L 38 -70" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="40" cy="-71" r="3.5" fill="#38bdf8" />

            {/* Top Left Green & Orange Rays */}
            <path d="M -30 -30 L -53 -44 L -63 -58" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="-65" cy="-60" r="3.8" fill="#fb923c" />

            <path d="M -40 -15 L -62 -24 L -74 -34" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="-76" cy="-35" r="3.5" fill="#38bdf8" />

            {/* Top Right Orange & Cyan Rays */}
            <path d="M 30 -30 L 53 -44 L 64 -58" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="66" cy="-60" r="3.8" fill="#38bdf8" />

            <path d="M 40 -15 L 62 -24 L 75 -34" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="77" cy="-35" r="3.5" fill="#fb923c" />

            {/* Lateral West Rays */}
            <path d="M -45 0 L -68 0 L -78 -10" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="-80" cy="-10" r="3.8" fill="#4ade80" />

            <path d="M -42 15 L -63 19 L -75 14" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="-77" cy="14" r="3.5" fill="#fb923c" />

            <path d="M -35 30 L -58 44 L -69 39" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="-71" cy="39" r="3.8" fill="#38bdf8" />

            <path d="M -25 40 L -43 58 L -57 63" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="-59" cy="65" r="3.5" fill="#fb923c" />

            {/* Lateral East Rays */}
            <path d="M 45 0 L 68 0 L 78 -10" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="80" cy="-10" r="3.8" fill="#38bdf8" />

            <path d="M 42 15 L 63 19 L 75 14" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="77" cy="14" r="3.5" fill="#4ade80" />

            <path d="M 35 30 L 58 44 L 71 40" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="73" cy="40" r="3.8" fill="#fb923c" />

            <path d="M 25 40 L 43 58 L 59 63" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="61" cy="65" r="3.5" fill="#38bdf8" />

            {/* Bottom Rays */}
            <path d="M -15 45 L -24 63 L -36 70" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="-38" cy="71" r="3.5" fill="#38bdf8" />

            <path d="M 15 45 L 24 63 L 36 70" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="71" r="3.5" fill="#fb923c" />
          </g>

          {/* Central Main Circle Enclosure */}
          <circle cx="0" cy="0" r="43" stroke="#38bdf8" strokeWidth="2.5" fill="#040b19" opacity="0.95" />
          <circle cx="0" cy="0" r="43" stroke="#00e5ff" strokeWidth="1" opacity="0.6" filter="url(#neonGlow)" />

          {/* Glowing Inner "K" & "P" Stylized Circuit Logo */}
          <g filter="url(#softGlow)">
            {/* Letter 'K' in Circuit Lines (Left vertical bar & diagonals) */}
            <path d="M -21 -27 L -21 23" stroke="#38bdf8" strokeWidth="4.2" strokeLinecap="round" />
            <circle cx="-21" cy="-27" r="2.8" fill="#38bdf8" />
            
            {/* K Diagonals */}
            <path d="M -21 -4 L -3 -23" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="-3" cy="-23" r="2.8" fill="#38bdf8" />

            <path d="M -13 -5 L -3 14" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" />

            {/* Letter 'P' in Circuit Lines (Right curved stem) */}
            <path d="M 3 -25 L 3 23" stroke="#38bdf8" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M 3 -25 L 16 -25 C 25 -25, 25 -6, 16 -6 L 3 -6" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 5 -21 L 14 -21 C 21 -21, 21 -10, 14 -10 L 5 -10" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>

          {/* Satellite Dish Base / Antenna Transmitter (bottom of KP circle) */}
          <g transform="translate(-9, 23)">
            {/* Parabolic Dish */}
            <path d="M -11 2 C -7 13, 7 13, 11 2" stroke="#38bdf8" strokeWidth="2.5" fill="#0f172a" strokeLinecap="round" />
            {/* Feed Horn & Wave */}
            <line x1="0" y1="8" x2="0" y2="-2" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
            <circle cx="0" cy="-3" r="2" fill="#fb923c" />
            {/* Radio Waves */}
            <path d="M -4 -6 C -2 -8, 2 -8, 4 -6" stroke="#38bdf8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M -7 -9 C -3 -12, 3 -12, 7 -9" stroke="#38bdf8" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.8" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* LOGO TYPOGRAPHY (RIGHT: "PETA KOMANDO RRI" & "BANDAR LAMPUNG")            */}
        {/* ========================================================================= */}
        {showText && (
          <g transform="translate(230, 68)">
            {/* "PETA KOMANDO RRI" (Cyan glowing display title) */}
            <text
              x="0"
              y="28"
              fill="url(#textCyan)"
              fontSize="31"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              textLength="345"
              lengthAdjust="spacingAndGlyphs"
              filter="url(#softGlow)"
            >
              PETA KOMANDO RRI
            </text>

            {/* "BANDAR LAMPUNG" (Crisp solid white subtitle) */}
            <text
              x="0"
              y="74"
              fill="#FFFFFF"
              fontSize="31"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              textLength="345"
              lengthAdjust="spacingAndGlyphs"
            >
              BANDAR LAMPUNG
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

