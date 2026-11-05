import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export const BrandLogoSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Second Home Midnight Kitchen Logo"
    >
      <defs>
        <linearGradient id="shHouseGradient" x1="10" y1="14" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff6a1a" />
          <stop offset="1" stopColor="#ffb020" />
        </linearGradient>
        <filter id="moonGlow" x="24" y="0" width="28" height="24" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Small Yellow Crescent Moon above the roof */}
      <path
        d="M 37 3 A 7 7 0 1 1 32 15 A 5.5 5.5 0 0 0 37 3 Z"
        fill="#ffb020"
        filter="url(#moonGlow)"
      />

      {/* House Roof */}
      <path
        d="M 12 30 L 32 14 L 52 30"
        stroke="url(#shHouseGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* House Body */}
      <path
        d="M 18 30 V 54 C 18 56.2 19.8 58 22 58 H 42 C 44.2 58 46 56.2 46 54 V 30"
        stroke="url(#shHouseGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#ff6a1a"
        fillOpacity="0.06"
      />

      {/* Crossed Fork and Spoon Inside House */}
      <g stroke="#f3f4f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Spoon: Handle from bottom-left to top-right with bowl */}
        <line x1="25" y1="49" x2="38" y2="35" />
        <ellipse
          cx="39.5"
          cy="33.5"
          rx="3.5"
          ry="4.5"
          transform="rotate(45 39.5 33.5)"
          fill="#ffb020"
          stroke="#ffb020"
        />

        {/* Fork: Handle from bottom-right to top-left with prongs */}
        <line x1="39" y1="49" x2="26" y2="35" />
        {/* Fork Prongs */}
        <path
          d="M 23 33 L 26 35 L 29 33 M 26 32 L 26 35"
          stroke="#f3f4f6"
          strokeWidth="1.8"
        />
      </g>
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 40,
  showText = true,
  textClassName = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BrandLogoSvg size={size} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold tracking-tight font-heading text-white ${textClassName || 'text-xl'}`}>
            Second Home
          </span>
          <span className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase mt-0.5">
            2nd Home • Midnight Kitchen
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
