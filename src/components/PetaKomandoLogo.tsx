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
    md: 'max-w-[400px]',
    lg: 'max-w-[520px]',
    xl: 'max-w-[600px]',
    full: 'max-w-full',
  }[size];

  return (
    <div className={`w-full ${maxWidthClass} select-none mx-auto ${className}`}>
      <svg
        viewBox="0 0 400 133"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto aspect-[400/133] block drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Cyber Background Gradient */}
          <linearGradient id="cyberGridBg" x1="0" y1="0" x2="400" y2="133" gradientUnits="userSpaceOnUse">
            <stop stopColor="#050B14" />
            <stop offset="1" stopColor="#020610" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Background Plate for 400x133 canvas */}
        <rect width="400" height="133" rx="8" fill="url(#cyberGridBg)" stroke="#1e293b" strokeWidth="1" />

        {/* Exact Cyber Grid Lines matching peta_komando_login_400x133.png */}
        <g opacity="0.3" stroke="#ffffff" strokeWidth="0.7">
          {/* Horizontal lines */}
          <line x1="0" y1="33.25" x2="400" y2="33.25" />
          <line x1="0" y1="66.5" x2="400" y2="66.5" />
          <line x1="0" y1="99.75" x2="400" y2="99.75" />
          {/* Vertical lines */}
          <line x1="44.4" y1="0" x2="44.4" y2="133" />
          <line x1="88.8" y1="0" x2="88.8" y2="133" />
          <line x1="133.3" y1="0" x2="133.3" y2="133" />
          <line x1="177.7" y1="0" x2="177.7" y2="133" />
          <line x1="222.2" y1="0" x2="222.2" y2="133" />
          <line x1="266.6" y1="0" x2="266.6" y2="133" />
          <line x1="311.1" y1="0" x2="311.1" y2="133" />
          <line x1="355.5" y1="0" x2="355.5" y2="133" />
        </g>

        {/* ========================================================================= */}
        {/* EMBLEM / ICON LOGO (LEFT CENTER: cx=76, cy=66.5)                          */}
        {/* ========================================================================= */}
        <g id="kp-emblem" transform="translate(76, 66.5)">
          {/* Radiating Ambient Glow Ring */}
          <circle cx="0" cy="0" r="48" fill="#0284c7" opacity="0.15" filter="url(#neonGlow)" />

          {/* Outer Circuit Nodes & Traces (Top / Left / Right / Bottom) */}
          <g filter="url(#softGlow)">
            {/* Top Cyan Rays */}
            <path d="M 0 -30 L 0 -48" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="0" cy="-50" r="2.8" fill="#00E5FF" />

            <path d="M -10 -28 L -17 -42 L -25 -47" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="-27" cy="-48" r="2.4" fill="#22C55E" />

            <path d="M 10 -28 L 17 -42 L 25 -47" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="27" cy="-48" r="2.4" fill="#00E5FF" />

            {/* Top Left Orange & Cyan Rays */}
            <path d="M -20 -20 L -35 -29 L -42 -39" stroke="#FF7B00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="-43" cy="-40" r="2.6" fill="#FF7B00" />

            <path d="M -27 -10 L -41 -16 L -49 -23" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="-51" cy="-24" r="2.4" fill="#00E5FF" />

            {/* Top Right Cyan & Orange Rays */}
            <path d="M 20 -20 L 35 -29 L 43 -39" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="44" cy="-40" r="2.6" fill="#00E5FF" />

            <path d="M 27 -10 L 41 -16 L 50 -23" stroke="#FF7B00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="51" cy="-23" r="2.4" fill="#FF7B00" />

            {/* Lateral West Rays */}
            <path d="M -30 0 L -45 0 L -52 -7" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="-54" cy="-7" r="2.6" fill="#22C55E" />

            <path d="M -28 10 L -42 13 L -50 9" stroke="#FF7B00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="-51" cy="9" r="2.4" fill="#FF7B00" />

            <path d="M -23 20 L -39 29 L -46 26" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="-47" cy="26" r="2.6" fill="#00E5FF" />

            <path d="M -17 27 L -29 39 L -38 42" stroke="#FF7B00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="-39" cy="43" r="2.4" fill="#FF7B00" />

            {/* Lateral East Rays */}
            <path d="M 30 0 L 45 0 L 52 -7" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="53" cy="-7" r="2.6" fill="#00E5FF" />

            <path d="M 28 10 L 42 13 L 50 9" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="51" cy="9" r="2.4" fill="#22C55E" />

            <path d="M 23 20 L 39 29 L 47 27" stroke="#FF7B00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="49" cy="27" r="2.6" fill="#FF7B00" />

            <path d="M 17 27 L 29 39 L 39 42" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="41" cy="43" r="2.4" fill="#00E5FF" />

            {/* Bottom Rays */}
            <path d="M -10 30 L -16 42 L -24 47" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="-25" cy="47" r="2.4" fill="#00E5FF" />

            <path d="M 10 30 L 16 42 L 24 47" stroke="#FF7B00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="25" cy="47" r="2.4" fill="#FF7B00" />
          </g>

          {/* Central Main Circle Enclosure */}
          <circle cx="0" cy="0" r="29" stroke="#00E5FF" strokeWidth="1.8" fill="#040814" opacity="0.98" />
          <circle cx="0" cy="0" r="29" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" filter="url(#neonGlow)" />

          {/* Glowing Inner "K" & "P" Stylized Circuit Logo */}
          <g filter="url(#softGlow)">
            {/* Letter 'K' in Circuit Lines */}
            <path d="M -14 -18 L -14 15" stroke="#00E5FF" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="-14" cy="-18" r="1.8" fill="#00E5FF" />

            {/* K Diagonals */}
            <path d="M -14 -3 L -2 -15" stroke="#00E5FF" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="-2" cy="-15" r="1.8" fill="#00E5FF" />

            <path d="M -9 -4 L -2 9" stroke="#FF7B00" strokeWidth="2.6" strokeLinecap="round" />

            {/* Letter 'P' in Circuit Lines */}
            <path d="M 2 -17 L 2 15" stroke="#00E5FF" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 2 -17 L 11 -17 C 17 -17, 17 -4, 11 -4 L 2 -4" stroke="#FF7B00" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 3 -14 L 9 -14 C 14 -14, 14 -7, 9 -7 L 3 -7" stroke="#00E5FF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>

          {/* Satellite Dish Base / Antenna Transmitter */}
          <g transform="translate(-6, 15)">
            <path d="M -8 1.5 C -5 9, 5 9, 8 1.5" stroke="#00E5FF" strokeWidth="1.8" fill="#0A101D" strokeLinecap="round" />
            <line x1="0" y1="5.5" x2="0" y2="-1.5" stroke="#FF7B00" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="0" cy="-2" r="1.4" fill="#FF7B00" />
            <path d="M -3 -4 C -1.5 -5.5, 1.5 -5.5, 3 -4" stroke="#00E5FF" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M -5 -6 C -2 -8, 2 -8, 5 -6" stroke="#00E5FF" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.85" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* LOGO TYPOGRAPHY (RIGHT: "PETA KOMANDO RRI" & "BANDAR LAMPUNG")            */}
        {/* ========================================================================= */}
        {showText && (
          <g transform="translate(158, 44)">
            {/* "PETA KOMANDO RRI" (Cyan bold display title) */}
            <text
              x="0"
              y="20"
              fill="#00B4D8"
              fontSize="21"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              letterSpacing="0.5"
              filter="url(#softGlow)"
            >
              PETA KOMANDO RRI
            </text>

            {/* "BANDAR LAMPUNG" (Crisp solid white subtitle) */}
            <text
              x="0"
              y="48"
              fill="#FFFFFF"
              fontSize="21"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              letterSpacing="0.5"
            >
              BANDAR LAMPUNG
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}


