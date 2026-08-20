import React from 'react';

interface PetaKomandoIconProps {
  className?: string;
  size?: number | string;
}

export default function PetaKomandoIcon({
  className = '',
  size = 36,
}: PetaKomandoIconProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="pkiBg" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B1120" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="pkiCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="pkiOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          <linearGradient id="pkiGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          <filter id="pkiNeon" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Dark Navy Circular Base */}
        <circle cx="100" cy="100" r="92" fill="url(#pkiBg)" stroke="#1e293b" strokeWidth="1.5" />

        {/* Radiant Ambient Glow Ring */}
        <circle cx="100" cy="100" r="75" fill="#0284c7" opacity="0.12" filter="url(#pkiNeon)" />

        {/* Outer Circuit Nodes & Radiant Traces */}
        <g id="pki-traces" transform="translate(100, 100)" filter="url(#pkiNeon)">
          {/* Top Cyan & Green Rays */}
          <path d="M 0 -45 L 0 -76" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-79" r="5" fill="#38bdf8" />

          <path d="M -15 -42 L -25 -65 L -42 -74" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="-45" cy="-75" r="4" fill="#4ade80" />

          <path d="M 15 -42 L 25 -65 L 42 -74" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="45" cy="-75" r="4" fill="#38bdf8" />

          {/* Top Left Amber & Cyan Rays */}
          <path d="M -30 -30 L -55 -45 L -68 -62" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="-71" cy="-65" r="4.5" fill="#fb923c" />

          <path d="M -40 -15 L -65 -25 L -80 -36" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="-83" cy="-38" r="4" fill="#38bdf8" />

          {/* Top Right Orange & Cyan Rays */}
          <path d="M 30 -30 L 55 -45 L 70 -62" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="73" cy="-65" r="4.5" fill="#38bdf8" />

          <path d="M 40 -15 L 65 -25 L 82 -36" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="85" cy="-38" r="4" fill="#fb923c" />

          {/* Lateral West Rays */}
          <path d="M -45 0 L -72 0 L -82 -12" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="-85" cy="-12" r="4.5" fill="#4ade80" />

          <path d="M -42 16 L -66 22 L -80 16" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="-83" cy="16" r="4" fill="#fb923c" />

          <path d="M -35 32 L -62 46 L -74 42" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="-77" cy="42" r="4.5" fill="#38bdf8" />

          <path d="M -25 42 L -46 62 L -62 68" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="-65" cy="70" r="4" fill="#fb923c" />

          {/* Lateral East Rays */}
          <path d="M 45 0 L 72 0 L 84 -12" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="87" cy="-12" r="4.5" fill="#38bdf8" />

          <path d="M 42 16 L 66 22 L 82 16" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="85" cy="16" r="4" fill="#4ade80" />

          <path d="M 35 32 L 62 46 L 76 42" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="79" cy="42" r="4.5" fill="#fb923c" />

          <path d="M 25 42 L 46 62 L 64 68" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="67" cy="70" r="4" fill="#38bdf8" />

          {/* Bottom Rays */}
          <path d="M -15 45 L -26 66 L -40 74" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="-42" cy="76" r="4" fill="#38bdf8" />

          <path d="M 15 45 L 26 66 L 40 74" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="42" cy="76" r="4" fill="#fb923c" />
        </g>

        {/* Central Main Circle Frame */}
        <circle cx="100" cy="100" r="46" stroke="#38bdf8" strokeWidth="3" fill="#040b19" opacity="0.95" />
        <circle cx="100" cy="100" r="46" stroke="#00e5ff" strokeWidth="1.2" opacity="0.7" filter="url(#pkiNeon)" />

        {/* Glowing Circuit "KP" Lettermark */}
        <g id="pki-kp-logo" transform="translate(100, 100)" filter="url(#pkiNeon)">
          {/* Letter 'K' in Circuit Lines */}
          <path d="M -23 -29 L -23 25" stroke="#38bdf8" strokeWidth="4.8" strokeLinecap="round" />
          <circle cx="-23" cy="-29" r="3.2" fill="#38bdf8" />

          {/* K Diagonals */}
          <path d="M -23 -4 L -3 -25" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="-3" cy="-25" r="3.2" fill="#38bdf8" />

          <path d="M -14 -6 L -3 15" stroke="#fb923c" strokeWidth="4.5" strokeLinecap="round" />

          {/* Letter 'P' in Circuit Lines */}
          <path d="M 3 -27 L 3 25" stroke="#38bdf8" strokeWidth="4.8" strokeLinecap="round" />
          <path d="M 3 -27 L 17 -27 C 28 -27, 28 -6, 17 -6 L 3 -6" stroke="#fb923c" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 5 -23 L 15 -23 C 23 -23, 23 -10, 15 -10 L 5 -10" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Transmitter Satellite Dish on Base of KP */}
          <g transform="translate(-10, 25)">
            <path d="M -13 2 C -9 15, 9 15, 13 2" stroke="#38bdf8" strokeWidth="2.8" fill="#0f172a" strokeLinecap="round" />
            <line x1="0" y1="9" x2="0" y2="-2" stroke="#fb923c" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="0" cy="-3" r="2.2" fill="#fb923c" />
            <path d="M -4 -6 C -2 -8, 2 -8, 4 -6" stroke="#38bdf8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M -7 -9 C -3 -12, 3 -12, 7 -9" stroke="#38bdf8" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85" />
          </g>
        </g>
      </svg>
    </div>
  );
}
