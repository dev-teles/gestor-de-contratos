import React from 'react';

interface RioMaisLogoProps {
  className?: string;
  size?: number | string;
  rounded?: boolean;
}

export const RioMaisLogo: React.FC<RioMaisLogoProps> = ({
  className = '',
  size = 36,
  rounded = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Rich vibrant royal blue radial gradient */}
        <radialGradient
          id="riomais-bg-grad"
          cx="48%"
          cy="48%"
          r="68%"
          fx="48%"
          fy="48%"
        >
          <stop offset="0%" stopColor="#2b66f6" />
          <stop offset="35%" stopColor="#1e52db" />
          <stop offset="70%" stopColor="#143cb0" />
          <stop offset="100%" stopColor="#0b236e" />
        </radialGradient>

        {/* Soft inner ambient glow */}
        <filter id="riomais-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.5"
            floodColor="#000000"
            floodOpacity="0.18"
          />
        </filter>
      </defs>

      {/* Rounded Square Background */}
      <rect
        width="200"
        height="200"
        rx={rounded ? "38" : "0"}
        fill="url(#riomais-bg-grad)"
      />

      {/* Subtle border highlight */}
      <rect
        x="1"
        y="1"
        width="198"
        height="198"
        rx={rounded ? "37" : "0"}
        fill="none"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="2"
      />

      {/* 
        Official Grupo RioMais Monogram / Crest
        Continuous calligraphy ribbon intertwined in 4 loops (quatrefoil / cross)
      */}
      <g filter="url(#riomais-glow)" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top Loop: vertical ascending ribbon curving into top loop */}
        <path
          d="M 94 135
             L 94 65
             C 94 48, 80 44, 75 56
             C 70 70, 88 78, 100 85
             C 114 93, 126 78, 126 62
             C 126 48, 114 44, 106 44
             C 98 44, 94 54, 94 65"
        />

        {/* Bottom Loop: vertical descending ribbon curving into bottom loop */}
        <path
          d="M 106 65
             L 106 135
             C 106 152, 120 156, 125 144
             C 130 130, 112 122, 100 115
             C 86 107, 74 122, 74 138
             C 74 152, 86 156, 94 156
             C 102 156, 106 146, 106 135"
        />

        {/* Left 'S' ribbon loop extending outward to the left */}
        <path
          d="M 125 93
             C 105 92, 85 92, 68 93
             C 50 94, 44 80, 56 75
             C 70 70, 78 88, 85 100
             C 93 114, 78 126, 62 126
             C 48 126, 44 114, 44 106
             C 44 98, 54 94, 68 93
             C 88 92, 110 93, 132 94"
        />

        {/* Right 'S' ribbon loop extending outward to the right */}
        <path
          d="M 75 107
             C 95 108, 115 108, 132 107
             C 150 106, 156 120, 144 125
             C 130 130, 122 112, 115 100
             C 107 86, 122 74, 138 74
             C 152 74, 156 86, 156 94
             C 156 102, 146 106, 132 107
             C 112 108, 90 107, 68 106"
        />

        {/* Core cross tie accent curves overlapping in center */}
        <path
          d="M 64 93 C 82 91, 118 91, 136 93"
          strokeWidth="7"
        />
        <path
          d="M 64 107 C 82 109, 118 109, 136 107"
          strokeWidth="7"
        />
        <path
          d="M 94 65 C 92 82, 92 118, 94 135"
          strokeWidth="7"
        />
        <path
          d="M 106 65 C 108 82, 108 118, 106 135"
          strokeWidth="7"
        />
      </g>
    </svg>
  );
};
