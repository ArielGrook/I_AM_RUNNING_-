'use client';

import React from 'react';

const iconProps = { className?: string; width?: number; height?: number };
const w = (p: typeof iconProps) => p?.width ?? 16;
const h = (p: typeof iconProps) => p?.height ?? 16;

export const Icons = {
  Container: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" />
    </svg>
  ),
  Text: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <path d="M2 4h12M8 4v9M5 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Button: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="4" width="14" height="8" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Image: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M1 11l4-3 3 2.5 3-4 4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Divider: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <path d="M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  ),
  Video: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 6l4-2v8l-4-2V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  Hero: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h8M5 11h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M4 6h8" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Features: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  CTA: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="6" width="8" height="4" rx="1.5" fill="#FF6B35" opacity="0.8" />
    </svg>
  ),
  Testimonials: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <path d="M2 4c0-1.1.9-2 2-2h8a2 2 0 012 2v6a2 2 0 01-2 2H5l-3 2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  Pricing: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <path d="M8 1v14M1 5h14M1 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  FAQ: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6c0-1.1-.9-2 2-2s2 .9 2 2c0 1-1 1.5-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.75" fill="currentColor" />
    </svg>
  ),
  Header: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="1" width="14" height="5" rx="2" fill="currentColor" opacity="0.15" />
      <path d="M1 6h14" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  Footer: (p: typeof iconProps) => (
    <svg width={w(p)} height={h(p)} viewBox="0 0 16 16" fill="none" className={p?.className}>
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="10" width="14" height="5" rx="2" fill="currentColor" opacity="0.15" />
      <path d="M1 10h14" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
};
