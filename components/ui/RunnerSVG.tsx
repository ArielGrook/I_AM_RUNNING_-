/**
 * RunnerSVG — the single source of truth for the I AM RUNNING logo mark.
 *
 * Uses the filled-silhouette "worker running with briefcase" glyph from SVG
 * Repo (id 173169, CC0 / public-domain). Path is kept verbatim from the
 * original asset; we only changed fill → currentColor so the logo can be
 * recolored anywhere via the `color` prop.
 *
 * Usage:
 *   <RunnerSVG size={32} color="#fff" />
 *   <RunnerSVG size={48} color="#FF6B35" />
 *   <RunnerSVG size={24} /> // defaults to orange brand color
 */

import React from 'react';

interface RunnerSVGProps {
  size?: number | string;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

export function RunnerSVG({
  size = 24,
  color = '#FF6B35',
  className,
  'aria-label': ariaLabel = 'I AM RUNNING',
}: RunnerSVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 144.352 144.352"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ color, display: 'inline-block', flexShrink: 0 }}
    >
      <g fill="currentColor">
        <path d="M82.766,20.216c0-7.942,6.438-14.38,14.381-14.38c7.94,0,14.38,6.438,14.38,14.38c0,7.941-6.438,14.379-14.38,14.379
          C89.203,34.595,82.766,28.157,82.766,20.216z M117.584,67.915l26.768-22.996l-6.946-8.086l-20.177,17.333L102.27,42.529
          l-25.453-9.917h-31.57L30.222,66.594l-4.006-1.671l-1.619,3.88l-0.601,1.439l-0.6,1.438l-4.676-1.951l-10.805,25.9l25.171,10.501
          l2.049,0.854l0.435-1.043l10.37-24.857l-4.556-1.9l0.6-1.439l0.6-1.438l1.619-3.88l-4.14-1.727l12.126-27.427h20.77L58.635,82.859
          l-3.494,21.598l-6.341,0.482l-2.752,6.598l-1.201,2.879l-2.878-1.2l-15.735-6.563l-2.565,0.193l1.076,14.174l42.574-3.229
          l4.322-25.777l1.043,0.731l16.822,12.439l1.65,33.332l14.197-0.703l-1.986-40.055l-20.596-15.23l14.703-30.16L117.584,67.915z
          M10.805,66.429L0,92.328l4.317,1.802l10.805-25.9L10.805,66.429z M45.31,105.201l8.663-20.766l-4.437-1.852l-9.605,23.025
          l-1.199,2.875l4.437,1.852L45.31,105.201z" />
      </g>
    </svg>
  );
}
